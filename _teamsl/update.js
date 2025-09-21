const axios = require("axios"); // Importing axios for making HTTP requests
const { mail, getEmailText } = require("../_mailer/mailer"); // Importing mail and getEmailText from mailer
const { Liga, Match, User, Club } = require("../_models"); // Importing Liga, Match, User, Club models
const clubService = require('../_services/clubService'); // Importing club service
const { Op } = require('sequelize'); // Importing Sequelize operators

// Dynamischer Import für ES6-Modul
let BasketballBundSDK;
(async () => {
  const { BasketballBundSDK: SDK } = await import("basketball-bund-sdk");
  BasketballBundSDK = SDK;
})();

/**
 * This function updates the leagues data.
 * @param {number} index - The index to start at when fetching the leagues data.
 * @returns {Promise} - A Promise that resolves when the leagues data is updated.
 */
module.exports.updateLigen = async function updateLigen(index = 0) {
  // Warten bis SDK geladen ist
  if (!BasketballBundSDK) {
    const { BasketballBundSDK: SDK } = await import("basketball-bund-sdk");
    BasketballBundSDK = SDK;
  }

  const sdk = new BasketballBundSDK();
  const response = await sdk.wam.getLigaList({
    akgGeschlechtIds: [],
    altersklasseIds: [],
    gebietIds: [101],
    ligatypIds: [],
    sortBy: 0,
    spielklasseIds: [722],
    token: "",
    verbandIds: [7],
    startAtIndex: index,
  });
  if (!response) {
    console.log("No response from getLeagues");
    return;
  }
  try {
    const ligen = response.ligen;
    for (const liga of ligen) {
        const [league, created] = await Liga.findOrCreate({
          where: { ligaId: liga.ligaId },
          defaults: liga
        });
        
        if (created) {
          console.log(`Created: ${liga.ligaId}`);
        } else {
          console.log(`Updated: ${liga.ligaId}`);
          await league.update(liga);
        }
    }

    if (response.hasMoreData) {
      await updateLigen(parseInt(index) + parseInt(response.size));
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * This function updates the matches data.
 * @returns {Promise} - A Promise that resolves when the matches data is updated.
 */
module.exports.updateMatches = async function updateMatches() {
  console.log('🏀 Starte Match-Update...');
  
  // 1. Alle Ligen holen
  const ligen = await Liga.findAll();
  console.log(`📋 ${ligen.length} Ligen gefunden`);
  
  // 2. Alle Matches holen und Club-IDs sammeln
  const allClubIds = new Set();
  const allMatches = [];
  
  for (const liga of ligen) {
    console.log(`📊 Verarbeite Liga ${liga.ligaId}...`);
    const matches = await getMatchesForLiga(liga);
    if (matches && matches.length > 0) {
      allMatches.push({ liga, matches });
      
      // Club-IDs sammeln
      for (const match of matches) {
        if (match.homeTeam && match.homeTeam.clubId) {
          allClubIds.add(parseInt(match.homeTeam.clubId));
        }
        if (match.guestTeam && match.guestTeam.clubId) {
          allClubIds.add(parseInt(match.guestTeam.clubId));
        }
        if (match.sr1 && match.sr1 !== "Pool" && !isNaN(match.sr1)) {
          allClubIds.add(parseInt(match.sr1));
        }
        if (match.sr2 && match.sr2 !== "Pool" && !isNaN(match.sr2)) {
          allClubIds.add(parseInt(match.sr2));
        }
      }
    }
  }
  
  console.log(`🎯 ${allClubIds.size} einzigartige Club-IDs gefunden`);
  
  // 3. Nur fehlende Clubs laden
  if (allClubIds.size > 0) {
    console.log('🏢 Prüfe welche Clubs fehlen...');
    const existingClubs = await Club.findAll({
      where: { clubId: Array.from(allClubIds) },
      attributes: ['clubId']
    });
    const existingClubIds = new Set(existingClubs.map(club => club.clubId));
    const missingClubIds = Array.from(allClubIds).filter(id => !existingClubIds.has(id));
    
    if (missingClubIds.length > 0) {
      console.log(`📥 Lade ${missingClubIds.length} fehlende Clubs von ${allClubIds.size} total...`);
      await clubService.getMultipleClubs(missingClubIds);
      console.log('✅ Fehlende Clubs geladen');
    } else {
      console.log('✅ Alle Clubs bereits in der Datenbank vorhanden');
    }
  }
  
  // 4. Matches verarbeiten (jetzt sind alle Clubs bereits geladen)
  console.log('⚽ Verarbeite Matches...');
  const requests = allMatches.map(({ liga, matches }) => processMatchesForLiga(liga, matches));
  await Promise.all(requests);
  
  console.log('✅ Match-Update abgeschlossen');
};

/**
 * Holt alle Matches für eine Liga
 * @param {object} liga - The league data.
 * @returns {Promise<Array>} - Array of matches with additional data
 */
async function getMatchesForLiga(liga) {
  // Warten bis SDK geladen ist
  if (!BasketballBundSDK) {
    const { BasketballBundSDK: SDK } = await import("basketball-bund-sdk");
    BasketballBundSDK = SDK;
  }

  const sdk = new BasketballBundSDK();
  const data = await sdk.competition.getSpielplan({
    competitionId: liga.ligaId,
  });
  
  if (!data || !data.matches) {
    console.log(`No matches found for liga ${liga.ligaId}`);
    return [];
  }

  const matches = data.matches;
  const enrichedMatches = [];

  for (const match of matches) {
    try {
      const matchInfo = await sdk.match.getMatchInfo({
        matchId: match.matchId,
      });
      
      // SR-Daten extrahieren
      let sr1 = null;
      let sr2 = null;
      if (matchInfo.matchInfo.srList) {
        if (matchInfo.matchInfo.srList[0]) {
          if (matchInfo.matchInfo.srList[0].personData) {
            if (matchInfo.matchInfo.srList[0].personData.vorname.toLowerCase() === "verein") {
              sr1 = matchInfo.matchInfo.srList[0].personData.nachname;
            } else {
              sr1 = "besetzt";
            }
          }
        }
        if (matchInfo.matchInfo.srList[1]) {
          if (matchInfo.matchInfo.srList[1].personData) {
            if (matchInfo.matchInfo.srList[1].personData.vorname.toLowerCase() === "verein") {
              sr2 = matchInfo.matchInfo.srList[1].personData.nachname;
            } else {
              sr2 = "besetzt";
            }
          }
        }
      }

      enrichedMatches.push({
        ...match,
        homeTeam: matchInfo.homeTeam,
        guestTeam: matchInfo.guestTeam,
        sr1,
        sr2,
        matchInfo: matchInfo.matchInfo
      });
    } catch (error) {
      console.error(`Fehler beim Laden von Match ${match.matchId}:`, error.message);
      enrichedMatches.push(match);
    }
  }

  return enrichedMatches;
}

/**
 * Verarbeitet alle Matches für eine Liga (nachdem alle Clubs geladen wurden)
 * @param {object} liga - The league data.
 * @param {Array} matches - Array of enriched matches
 * @returns {Promise} - A Promise that resolves when all matches are processed
 */
async function processMatchesForLiga(liga, matches) {
  console.log(`⚽ Verarbeite ${matches.length} Matches für Liga ${liga.ligaId}`);
  
  const promise = matches.map((match, index) =>
    matchRef(match, index, matches.length, liga)
  );
  await Promise.all(promise);
  return await liga.save();
}

/**
 * This function updates the referee data for a specific match.
 * @param {object} _m - The enriched match data.
 * @param {number} index - The index of the match.
 * @param {number} max - The total number of matches.
 * @param {object} liga - The league data.
 * @returns {Promise} - A Promise that resolves when the referee data for the match is updated.
 */
async function matchRef(_m, index, max, liga) {
  // Die Match-Daten sind bereits angereichert
  const matchInfo = _m;
  let sr1 = _m.sr1;
  let sr2 = _m.sr2;
  
  // Hole Club-Namen aus dem bereits geladenen Cache
  let homeTeamClubName = null;
  if (matchInfo.homeTeam && matchInfo.homeTeam.clubId) {
    try {
      const homeTeamClub = await clubService.getOrCreateClub(parseInt(matchInfo.homeTeam.clubId));
      homeTeamClubName = homeTeamClub.vereinsname;
    } catch (error) {
      console.error(`Fehler beim Laden des Heimteam-Clubs ${matchInfo.homeTeam.clubId}:`, error.message);
      homeTeamClubName = matchInfo.homeTeam.teamname; // Fallback auf Teamname
    }
  }

  // Hole Club-Namen für sr1 und sr2 aus dem bereits geladenen Cache
  let sr1ClubName = null;
  let sr2ClubName = null;
  
  if (sr1 && sr1 !== "Pool" && !isNaN(sr1)) {
    try {
      const sr1Club = await clubService.getOrCreateClub(parseInt(sr1));
      sr1ClubName = sr1Club.vereinsname;
    } catch (error) {
      console.error(`Fehler beim Laden von Club ${sr1}:`, error.message);
      sr1ClubName = sr1.toString();
    }
  }
  
  if (sr2 && sr2 !== "Pool" && !isNaN(sr2)) {
    try {
      const sr2Club = await clubService.getOrCreateClub(parseInt(sr2));
      sr2ClubName = sr2Club.vereinsname;
    } catch (error) {
      console.error(`Fehler beim Laden von Club ${sr2}:`, error.message);
      sr2ClubName = sr2.toString();
    }
  }

  // Wenn sr1 oder sr2 null sind, setze den Vereinsnamen des Heimteams
  if(sr1 === null && homeTeamClubName){
    sr1 = homeTeamClubName;
    sr1ClubName = homeTeamClubName;
  }
  if(sr2 === null && homeTeamClubName){
    sr2 = homeTeamClubName;
    sr2ClubName = homeTeamClubName;
  }

  if (!matchInfo.homeTeam || !matchInfo.guestTeam) {
    console.log("SKIPPED: KEIN TEAM => " + matchInfo.matchId);
    return;
  }

  var match = {
    matchId: matchInfo.matchId,
    matchDay: matchInfo.matchDay,
    matchNo: matchInfo.matchNo,
    kickoffDate: matchInfo.kickoffDate,
    kickoffTime: matchInfo.kickoffTime,
    verzicht: matchInfo.verzicht,
    abgesagt: matchInfo.abgesagt,
    liganame: matchInfo.ligaData ? matchInfo.ligaData.liganame : liga.liganame || 'Unbekannte Liga',
    homeTeam: matchInfo.homeTeam ? matchInfo.homeTeam.teamname : 'Unbekanntes Team',
    guestTeam: matchInfo.guestTeam ? matchInfo.guestTeam.teamname : 'Unbekanntes Team',
    spielfeld: matchInfo.matchInfo && matchInfo.matchInfo.spielfeld ? matchInfo.matchInfo.spielfeld.bezeichnung : 'Unbekannt',
    sr1: sr1,
    sr1Basar: false,
    sr1Besetzt: false,
    sr1Bonus: null,
    sr1Info: null,
    sr1Name: sr1ClubName,
    sr2: sr2,
    sr2Basar: false,
    sr2Besetzt: false,
    sr2Bonus: null,
    sr2Info: null,
    sr2Name: sr2ClubName,
  };
  const [matchRef, created] = await Match.findOrCreate({
    where: { matchId: match.matchId },
    defaults: match
  });

  if (created) {
    console.log(`${liga.ligaId}: CREATE ${index} / ${max}`);
  } else {
    // Prüfe ob Update nötig ist
    if (matchRef.homeTeam !== match.homeTeam) {
      await matchRef.update({
        homeTeam: matchInfo.homeTeam.teamname,
      });
    }
    if (matchRef.guestTeam !== match.guestTeam) {
      await matchRef.update({
        guestTeam: matchInfo.guestTeam.teamname,
      });
    }
        if (
          matchRef.kickoffDate !== match.kickoffDate ||
          matchRef.kickoffTime !== match.kickoffTime ||
          matchRef.verzicht !== match.verzicht ||
          matchRef.abgesagt !== match.abgesagt
        ) {
          if (matchRef.sr1Basar || matchRef.sr1Besetzt) {
            const user = await User.findAll({ where: { club: { [Op.contains]: [matchRef.sr1] } } });
            const date = new Date(matchRef.kickoffDate);
            const newDate = new Date(match.kickoffDate);
            await mail(
              matchRef.sr1Mail
                ? [...user.map((_u) => _u.email), matchRef.sr1Mail]
                : user.map((_u) => _u.email),
              "[SPIELEBASAR] Info Veränderung Spielplan",
              getEmailText(
                "",
                "du erhälst diese Mail, da es eine Veränderung im Spielplan gab und dieses Spiel im Basar oder als besetzt markiert hast. Die Ansetzung entfällt!",
                false,
                `<strong>Spiel (alt):</strong><br/>${matchRef.liganame}  ${
                  matchRef.matchNo
                }<br/>${date.getDate()}.${
                  date.getMonth() + 1
                }.${date.getFullYear()} ${matchRef.kickoffTime}<br/>${
                  matchRef.spielfeld
                }<br/>
                                            ${matchRef.homeTeam} - ${
                  matchRef.guestTeam
                }<br/>${matchRef.sr1} ${
                  matchRef.sr2
                }<br/><br/><strong>Spiel (neu):</strong><br/>${newDate.getDate()}.${
                  newDate.getMonth() + 1
                }.${newDate.getFullYear()} ${match.kickoffTime}<br/>
                                            ${match.spielfeld}<br/>${
                  match.homeTeam
                } - ${match.guestTeam}<br/>${match.sr1} ${match.sr2}<br/><br/>
                                            <strong>Folgende Infos hattest du hinterlegt:</strong><br/>Bonus: ${
                                              matchRef.sr1Bonus
                                            }<br/>${
                  matchRef.sr1Name ? matchRef.sr1Name : "[*Keine Name hinterlegt*]"
                }<br/>${
                  matchRef.sr1Info
                    ? matchRef.sr1Info
                    : "[*Keine Informationen hinterlegt*]"
                }`
              )
            );
          }
          if (matchRef.sr2Basar || matchRef.sr2Besetzt) {
            const user = await User.findAll({ where: { club: { [Op.contains]: [matchRef.sr2] } } });
            const date = new Date(matchRef.kickoffDate);
            const newDate = new Date(match.kickoffDate);
            await mail(
              matchRef.sr2Mail
                ? [...user.map((_u) => _u.email), matchRef.sr2Mail]
                : user.map((_u) => _u.email),
              "[SPIELEBASAR] Info Veränderung Spielplan",
              getEmailText(
                "",
                "du erhälst diese Mail, da es eine Veränderung im Spielplan gab und dieses Spiel im Basar oder als besetzt markiert hast. Die Ansetzung entfällt!",
                false,
                `<strong>Spiel (alt):</strong><br/>${matchRef.liganame}  ${
                  matchRef.matchNo
                }<br/>${date.getDate()}.${
                  date.getMonth() + 1
                }.${date.getFullYear()} ${matchRef.kickoffTime}<br/>${
                  matchRef.spielfeld
                }<br/>
                                            ${matchRef.homeTeam} - ${
                  matchRef.guestTeam
                }<br/>${matchRef.sr1} ${
                  matchRef.sr2
                }<br/><br/><strong>Spiel (neu):</strong><br/>${newDate.getDate()}.${
                  newDate.getMonth() + 1
                }.${newDate.getFullYear()} ${match.kickoffTime}<br/>
                                            ${match.spielfeld}<br/>${
                  match.homeTeam
                } - ${match.guestTeam}<br/>${match.sr1} ${match.sr2}<br/><br/>
                                            <strong>Folgende Infos hattest du hinterlegt:</strong><br/>Bonus: ${
                                              matchRef.sr2Bonus
                                            }<br/>${
                  matchRef.sr2Name ? matchRef.sr2Name : "[*Keine Name hinterlegt*]"
                }<br/>${
                  matchRef.sr2Info
                    ? matchRef.sr2Info
                    : "[*Keine Informationen hinterlegt*]"
                }`
              )
            );
          }
          await matchRef.update(match);
          console.log(`${liga.ligaId}: UPDATED ${index} / ${max}`);
        } else {
          if (matchRef.sr1 !== match.sr1 || matchRef.sr2 !== match.sr2) {
            if (matchRef.sr2 !== match.sr2) {
              if (matchRef.sr2Basar || matchRef.sr2Besetzt) {
                const user = await User.findAll({ where: { club: { [Op.contains]: [matchRef.sr2] } } });
                const date = new Date(matchRef.kickoffDate);
                const newDate = new Date(match.kickoffDate);
                await mail(
                  matchRef.sr2Mail
                    ? [...user.map((_u) => _u.email), matchRef.sr2Mail]
                    : user.map((_u) => _u.email),
                  "[SPIELEBASAR] Info Veränderung Spielplan",
                  getEmailText(
                    "",
                    "du erhälst diese Mail, da es eine Veränderung im Spielplan gab und dieses Spiel im Basar oder als besetzt markiert hast. Die Ansetzung entfällt!",
                    false,
                    `<strong>Spiel (alt):</strong><br/>${matchRef.liganame}  ${
                      matchRef.matchNo
                    }<br/>${date.getDate()}.${
                      date.getMonth() + 1
                    }.${date.getFullYear()} ${matchRef.kickoffTime}<br/>${
                      matchRef.spielfeld
                    }<br/>
                                            ${matchRef.homeTeam} - ${
                      matchRef.guestTeam
                    }<br/>${matchRef.sr1} ${
                      matchRef.sr2
                    }<br/><br/><strong>Spiel (neu):</strong><br/>${newDate.getDate()}.${
                      newDate.getMonth() + 1
                    }.${newDate.getFullYear()} ${match.kickoffTime}<br/>
                                            ${match.spielfeld}<br/>${
                      match.homeTeam
                    } - ${match.guestTeam}<br/>${match.sr1} ${
                      match.sr2
                    }<br/><br/>
                                            <strong>Folgende Infos hattest du hinterlegt:</strong><br/>Bonus: ${
                                              matchRef.sr2Bonus
                                            }<br/>${
                      matchRef.sr2Name
                        ? matchRef.sr2Name
                        : "[*Keine Name hinterlegt*]"
                    }<br/>${
                      matchRef.sr2Info
                        ? matchRef.sr2Info
                        : "[*Keine Informationen hinterlegt*]"
                    }`
                  )
                );
              }
              await matchRef.update({
                sr2: sr2,
                sr2Basar: false,
                sr2Besetzt: false,
                sr2Mail: null,
                sr2Bonus: null,
                sr2Info: null,
                sr2Name: null,
              });
            }
            if (matchRef.sr1 !== match.sr1) {
              if (matchRef.sr1Basar || matchRef.sr1Besetzt) {
                const user = await User.findAll({ where: { club: { [Op.contains]: [matchRef.sr1] } } });
                const date = new Date(matchRef.kickoffDate);
                const newDate = new Date(match.kickoffDate);
                await mail(
                  matchRef.sr1Mail
                    ? [...user.map((_u) => _u.email), matchRef.sr1Mail]
                    : user.map((_u) => _u.email),
                  "[SPIELEBASAR] Info Veränderung Spielplan",
                  getEmailText(
                    "",
                    "du erhälst diese Mail, da es eine Veränderung im Spielplan gab und dieses Spiel im Basar oder als besetzt markiert hast. Die Ansetzung entfällt!",
                    false,
                    `<strong>Spiel (alt):</strong><br/>${matchRef.liganame}  ${
                      matchRef.matchNo
                    }<br/>${date.getDate()}.${
                      date.getMonth() + 1
                    }.${date.getFullYear()} ${matchRef.kickoffTime}<br/>${
                      matchRef.spielfeld
                    }<br/>
                                            ${matchRef.homeTeam} - ${
                      matchRef.guestTeam
                    }<br/>${matchRef.sr1} ${
                      matchRef.sr2
                    }<br/><br/><strong>Spiel (neu):</strong><br/>${newDate.getDate()}.${
                      newDate.getMonth() + 1
                    }.${newDate.getFullYear()} ${match.kickoffTime}<br/>
                                            ${match.spielfeld}<br/>${
                      match.homeTeam
                    } - ${match.guestTeam}<br/>${match.sr1} ${
                      match.sr2
                    }<br/><br/>
                                            <strong>Folgende Infos hattest du hinterlegt:</strong><br/>Bonus: ${
                                              matchRef.sr1Bonus
                                            }<br/>${
                      matchRef.sr1Name
                        ? matchRef.sr1Name
                        : "[*Keine Name hinterlegt*]"
                    }<br/>${
                      matchRef.sr1Info
                        ? matchRef.sr1Info
                        : "[*Keine Informationen hinterlegt*]"
                    }`
                  )
                );
              }
              await matchRef.update({
                sr1: sr1,
                sr1Basar: false,
                sr1Besetzt: false,
                sr1Mail: null,
                sr1Bonus: null,
                sr1Info: null,
                sr1Name: null,
              });
            }

            console.log(`${liga.ligaId}: REF ${index} / ${max}`);
          }
          if (matchRef.spielfeld !== match.spielfeld) {
            if (matchRef.sr1Basar || matchRef.sr1Besetzt) {
              const user = await User.findAll({ where: { club: { [Op.contains]: [matchRef.sr1] } } });
              const date = new Date(matchRef.kickoffDate);
              const newDate = new Date(match.kickoffDate);
              await mail(
                user.map((_u) => _u.email),
                "[SPIELEBASAR] Info Veränderung Spielplan",
                getEmailText(
                  "",
                  "du erhälst diese Mail, da es eine Veränderung im Spielplan gab und dieses Spiel im Basar oder als besetzt markiert hast. Die Ansetzung bleibt bestehen!",
                  false,
                  `<strong>Spiel (alt):</strong><br/>${matchRef.liganame}  ${
                    matchRef.matchNo
                  }<br/>${date.getDate()}.${
                    date.getMonth() + 1
                  }.${date.getFullYear()} ${matchRef.kickoffTime}<br/>${
                    matchRef.spielfeld
                  }<br/>
                                            ${matchRef.homeTeam} - ${
                    matchRef.guestTeam
                  }<br/>${matchRef.sr1} ${
                    matchRef.sr2
                  }<br/><br/><strong>Spiel (neu):</strong><br/>${newDate.getDate()}.${
                    newDate.getMonth() + 1
                  }.${newDate.getFullYear()} ${match.kickoffTime}<br/>
                                            ${match.spielfeld}<br/>${
                    match.homeTeam
                  } - ${match.guestTeam}<br/>${match.sr1} ${match.sr2}<br/><br/>
                                            <strong>Folgende Infos hattest du hinterlegt:</strong><br/>Bonus: ${
                                              matchRef.sr1Bonus
                                            }<br/>${
                    matchRef.sr1Name
                      ? matchRef.sr1Name
                      : "[*Keine Name hinterlegt*]"
                  }<br/>${
                    matchRef.sr1Info
                      ? matchRef.sr1Info
                      : "[*Keine Informationen hinterlegt*]"
                  }`
                )
              );
            }
            if (matchRef.sr2Basar || matchRef.sr2Besetzt) {
              const user = await User.findAll({ where: { club: { [Op.contains]: [matchRef.sr2] } } });
              const date = new Date(matchRef.kickoffDate);
              const newDate = new Date(match.kickoffDate);
              await mail(
                user.map((_u) => _u.email),
                "[SPIELEBASAR] Info Veränderung Spielplan",
                getEmailText(
                  "",
                  "du erhälst diese Mail, da es eine Veränderung im Spielplan gab und dieses Spiel im Basar oder als besetzt markiert hast. Die Ansetzung bleibt bestehen!",
                  false,
                  `<strong>Spiel (alt):</strong><br/>${matchRef.liganame}  ${
                    matchRef.matchNo
                  }<br/>${date.getDate()}.${
                    date.getMonth() + 1
                  }.${date.getFullYear()} ${matchRef.kickoffTime}<br/>${
                    matchRef.spielfeld
                  }<br/>
                                            ${matchRef.homeTeam} - ${
                    matchRef.guestTeam
                  }<br/>${matchRef.sr1} ${
                    matchRef.sr2
                  }<br/><br/><strong>Spiel (neu):</strong><br/>${newDate.getDate()}.${
                    newDate.getMonth() + 1
                  }.${newDate.getFullYear()} ${match.kickoffTime}<br/>
                                            ${match.spielfeld}<br/>${
                    match.homeTeam
                  } - ${match.guestTeam}<br/>${match.sr1} ${match.sr2}<br/><br/>
                                            <strong>Folgende Infos hattest du hinterlegt:</strong><br/>Bonus: ${
                                              matchRef.sr2Bonus
                                            }<br/>${
                    matchRef.sr2Name
                      ? matchRef.sr2Name
                      : "[*Keine Name hinterlegt*]"
                  }<br/>${
                    matchRef.sr2Info
                      ? matchRef.sr2Info
                      : "[*Keine Informationen hinterlegt*]"
                  }`
                )
              );
            }
            await matchRef.update({
              spielfeld: match.spielfeld,
            });
            console.log(`${liga.ligaId}: LOKATION ${index} / ${max}`);
          } else {
            console.log(`${liga.ligaId}: SKIPPED ${index} / ${max}`);
          }
        }
    console.log(`${liga.ligaId}: UPDATE ${index} / ${max}`);
  }
}
