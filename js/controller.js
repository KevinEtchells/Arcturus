/*global Vue*/
/*global settings*/
/*global maps*/
/*global utils*/

var vm,
    enterZone;

(function () {
    
    "use strict";
    
    var countdown,
        initAI,
        log;

    vm = new Vue({
        el: "#app",
        data: {
            page: "home",
            gpsWarning: false,
            showAllLogs: false,
            currentGame: {
                timeRemaining: -1,
                players: [{name: "YOU", credits: settings.CREDITS_START}],
                zones: [],
                logs: [],
                settings: settings
            },
            utils: {
                formatTime: function (time) {
                    var units2 = function (val) {
                        return val >= 10 ? val.toString() : "0" + val.toString();
                    };
                    return Math.floor(time / 60) + ":" + units2(time - (Math.floor(time / 60) * 60));
                },
                zoneCount: function (playerName) {
                    var count = 0;
                    vm.currentGame.zones.forEach(function (zone) {
                        if (zone.owner && zone.owner === playerName) {
                            count = count + 1;
                        }
                    });
                    return count;
                }
            }
        },
        computed: {
            sortedPlayers: function () {
                var players = JSON.parse(JSON.stringify(this.currentGame.players));
                return players.sort(function (a, b) {
                    if (a.credits === b.credits) {
                        return a.name > b.name ? 1 : -1;
                    } else {
                        return b.credits - a.credits;
                    }
                });
            },
            sortedLogs: function () {
                return this.currentGame.logs.sort(function (a, b) {
                    return a.time - b.time;
                });
            }
        },
        methods: {
            
            startGame: function () {
                var names = ["Kai", "Juno", "Luna", "Nova", "Thane", "Ursa"],
                    i;
                for (i = 0; i < settings.AI_PLAYERS; i = i + 1) {
                    this.currentGame.players.push({
                        name: names[i], //"AI " + (i + 1),
                        credits: settings.CREDITS_START
                    });
                }
                this.currentGame.timeRemaining = settings.GAME_LENGTH;
                log("Game started");
                countdown();
                initAI();
            },
            
            saveSettings: function () {
                settings.GAME_LENGTH = document.querySelector("#game-time").value * 60;
                settings.gameArea = maps.getGameArea();
                window.localStorage.setItem("Arcturus_Settings", JSON.stringify(settings));
                
                // recreate zones, just in case game area has changed
                vm.currentGame.zones = utils.createZones();
                maps.showZones(vm.currentGame.zones, vm.currentGame.settings);
                
                this.page = "home";
            },
            
            retryGPS: function () {
                this.gpsWarning = false;
                // TO DO: this doesn't actually do anything - need to see if we need to re-init gps on errorvm.se
            }

        },
        created: function () {

            var savedDataStr = window.localStorage.getItem("Arcturus_SaveGameData"),
                savedDataObj;

            window.setTimeout(function () {
                
                if (savedDataStr) {
                    if (window.confirm("Would you like to continue with the previous game?")) {
                        // TO DO: the trouble with this is that the AI timers start from scratch again
                        savedDataObj = JSON.parse(savedDataStr);
                        vm.currentGame = savedDataObj;
                        maps.init(savedDataObj.settings);
                        maps.showZones(savedDataObj.zones, savedDataObj.settings);
                        window.setTimeout(function () {
                            countdown();
                            initAI(true);
                        }, 1000);
                    } else { // clear previous game data
                        window.localStorage.removeItem("Arcturus_SaveGameData");
                    }
                } else {
                    maps.init(vm.currentGame.settings);
                    vm.currentGame.zones = utils.createZones();
                    maps.showZones(vm.currentGame.zones, vm.currentGame.settings);
                }

            }, 1000);
        }
    });
    
    
    enterZone = function (zone, player) {

        var purchaseConfirmed = false;
        
        if (!player) {
            player = vm.currentGame.players[0];
        }
        
        if (vm.currentGame.timeRemaining > 0) {

            if (player.name === "YOU" && zone.owner !== "YOU") {
                window.alert("You have entered " + zone.name + ". You have earned " + settings.CREDITS_EARNED + " credits.");
            }

            if (player.name !== zone.owner) {
                player.credits = player.credits + settings.CREDITS_EARNED;
            }

            // does this player already own this zone, if so, renew it
            if (zone.owner && zone.owner === player.name) {
                if (player.name === "YOU") {
                    if (window.confirm("Do you wish to renew this zone for " + Math.floor(zone.cost * settings.ZONES_RENEW_FACTOR) + " credits?")) {
                        player.credits = player.credits - Math.floor(zone.cost * settings.ZONES_RENEW_FACTOR);
                        zone.timeRemaining = settings.ZONES_RESET_TIME;
                        window.alert("Zone renewed");
                        log("YOU renewed " + zone.name + " for " + Math.floor(zone.cost * settings.ZONES_RENEW_FACTOR) + " credits");
                    }
                } else if (player.credits >= zone.cost && Math.random() > (1 - settings.AI_BUY_ZONE_CHANCE(vm.currentGame.timeRemaining))) {
                    player.credits = player.credits - Math.floor(zone.cost * settings.ZONES_RENEW_FACTOR);
                    zone.timeRemaining = settings.ZONES_RESET_TIME;
                    log(player.name + " renewed a zone for " + Math.floor(zone.cost * settings.ZONES_RENEW_FACTOR) + " credits");
                }

            // is zone controlled by someone else?
            } else if (zone.owner) {
                
                if (player.name === "YOU") {
                    window.alert("This zone is controlled by " + zone.owner + ". You must pay " + Math.floor(zone.cost * settings.ZONES_RENT_FACTOR) + " credits.");
                    log("YOU paid " + zone.owner + " " + Math.floor(zone.cost * settings.ZONES_RENT_FACTOR) + " credits for entering " + zone.name);
                } else if (zone.owner === "YOU") {
                    log(player.name + " paid YOU " + Math.floor(zone.cost * settings.ZONES_RENT_FACTOR) + " credits for entering " + zone.name);
                } else {
                    log(player.name + " paid " + zone.owner + " " + Math.floor(zone.cost * settings.ZONES_RENT_FACTOR) + " credits for entering a zone");
                }
                
                // debit the visting player:
                player.credits = player.credits - Math.floor(zone.cost * settings.ZONES_RENT_FACTOR);
                
                // credit the owner:
                vm.currentGame.players.forEach(function (loopPlayer) {
                    if (loopPlayer.name === zone.owner) {
                        loopPlayer.credits = loopPlayer.credits + Math.floor(zone.cost * settings.ZONES_RENT_FACTOR);
                        if (loopPlayer.name === "YOU") {
                            window.alert(player.name + " entered " + zone.name + " and has paid you " + Math.floor(zone.cost * settings.ZONES_RENT_FACTOR) + " credits.");
                        }
                    }
                });

            // if not, does player want to buy it?
            } else {

                if (player.name === "YOU") {
                    if (player.credits >= zone.cost) {
                        purchaseConfirmed = window.confirm("Would you like to control this zone for " + zone.cost + " credits?");
                    } else {
                        window.alert("You do not have enough credits to control this zone.");
                    }
                } else if (player.credits >= zone.cost && Math.random() > (1 - settings.AI_BUY_ZONE_CHANCE(vm.currentGame.timeRemaining))) {
                    purchaseConfirmed = true;
                }

                if (purchaseConfirmed) {
                    player.credits = player.credits - zone.cost;
                    zone.owner = player.name;
                    zone.timeRemaining = settings.ZONES_RESET_TIME;
                    if (player.name === "YOU") {
                        log("YOU bought control of " + zone.name + " for " + zone.cost + " credits");
                    } else {
                        log(player.name + " bought control of a zone for " + zone.cost + " credits");
                    }
                } else {
                    if (player.name === "YOU") {
                        log("YOU entered " + zone.name + " but chose not to control it");
                    } else {
                        log(player.name + " entered a zone but chose not to control it");
                    }
                }

            }
            
        }

    };
    
    // adds messages to log, but also auto-creates save points in case user reloads browser
    log = function (msg) {
        
        var timeRemaining = vm.currentGame.timeRemaining;
        
        // add message to log
        vm.currentGame.logs.push({
            time: timeRemaining,
            msg: msg
        });
        
        // save game, or clear data if game has ended
        if (timeRemaining > 0) {
            window.localStorage.setItem("Arcturus_SaveGameData", JSON.stringify(vm.currentGame));
        } else {
            window.localStorage.removeItem("Arcturus_SaveGameData");
        }

    };


    // continually update location
    (function () {

        var lastZoneIndex = ""; // Can't go back to the same zone immediately - TO DO: move this into enterZone?

        // continually update location
        navigator.geolocation.watchPosition(function (position) {

            // set position marker on map
            maps.setPosition(position.coords.latitude, position.coords.longitude);

            // check if in zone
            if (vm.currentGame.zones.length) {
                vm.currentGame.zones.forEach(function (zone) {
                    if (zone.name !== lastZoneIndex) {
                        if (utils.distanceBetweenPoints(zone, position.coords) < settings.ZONES_RADIUS) {
                            enterZone(zone, vm.currentGame.players[0]);
                            lastZoneIndex = zone.name;
                        }
                    }
                });
            }

        }, function () {
            vm.gpsWarning = true;
        }, {enableHighAccuracy: true});

    }());
    
    // check time-remaining every minute
    countdown = function () {
        if (vm.currentGame.timeRemaining > 0) {
            
            // time-remaning
            vm.currentGame.timeRemaining = vm.currentGame.timeRemaining - 1;
            
            // check for expired zones
            vm.currentGame.zones.forEach(function (zone) {
                if (zone.timeRemaining > 0) {
                    zone.timeRemaining = zone.timeRemaining - 1;
                } else if (zone.owner) {
                    if (zone.owner === "YOU") {
                        window.alert("You have lost control of " + zone.name);
                        log("YOU lost control of " + zone.name);
                    } else {
                        log(zone.owner + " lost control of a zone");
                    }
                    zone.owner = null;
                }
            });

            // next tick
            window.setTimeout(countdown, 1000);
        } else {
            log("Game Over");
        }
    };
    
    // AI players
    initAI = function (restart) {
        vm.currentGame.players.forEach(function (player) {
            var arriveAtZone = function () {
                var zone = vm.currentGame.zones[Math.floor(Math.random() * vm.currentGame.zones.length)];
                enterZone(zone, player);
                setTimeout(arriveAtZone, (Math.floor(Math.random() * (settings.AI_TIME_BETWEEN_ZONES_MAX - settings.AI_TIME_BETWEEN_ZONES_MIN)) + settings.AI_TIME_BETWEEN_ZONES_MIN) * 1000);
            };
            if (player.name !== "YOU") {
                if (restart) { // game has restarted, AI players can enter zone any time from now - I've just replaced AI_TIME_BETWEEN_ZONES_MIN with 1
                    setTimeout(arriveAtZone, (Math.floor(Math.random() * (settings.AI_TIME_BETWEEN_ZONES_MAX - 1)) + 1) * 1000);
                } else {
                    setTimeout(arriveAtZone, (Math.floor(Math.random() * (settings.AI_TIME_BETWEEN_ZONES_MAX - settings.AI_TIME_BETWEEN_ZONES_MIN)) + settings.AI_TIME_BETWEEN_ZONES_MIN) * 1000);
                }
            }
        });
    };
    
}());
