var settings = {
    
    GAME_LENGTH: 30 * 60, // seconds
    
    ZONE_COUNT: 20,
    ZONES_RADIUS: 20, // metres
    ZONE_SPACING_FACTOR: 2.5, // absolute minimum would be 2 times of zone radius
    ZONES_COST_MIN: 25,
    ZONES_COST_MAX: 100,
    ZONES_RENT_FACTOR: 1, // percentage of control cost, 1 = 100%
    ZONES_RENEW_FACTOR: 0.5, // percentage of control cost, 1 = 100%
    ZONES_RESET_TIME: 12 * 60, // seconds
    
    CREDITS_START: 500,
    CREDITS_EARNED: 50, // you earn credits each time you enter a zone, if you don't already control it
    
    AI_PLAYERS: 6,
    AI_TIME_BETWEEN_ZONES_MIN: 1.5 * 60, // seconds
    AI_TIME_BETWEEN_ZONES_MAX: 5 * 60, // seconds
    AI_BUY_ZONE_CHANCE: function (timeRemaining) { // timeRemaining in seconds 
        "use strict";
        var chance = 0.8;
        if (timeRemaining < (5 * 60)) {
            chance = Math.ceil(timeRemaining / 60) / 10;
        }
        return chance; // 1 = 100%   
    },

    gameArea: [
        {lat: 51.194, lng: -0.77},
        {lat: 51.183, lng: -0.77},
        {lat: 51.183, lng: -0.78},
        {lat: 51.194, lng: -0.78}
    ]

};

(function () {
    
    "use strict";
    
    var savedSettings = JSON.parse(window.localStorage.getItem("Arcturus_Settings") || "{}"),
        prop;
    
    if (savedSettings) {
        settings.GAME_LENGTH = savedSettings.GAME_LENGTH;
        settings.gameArea = savedSettings.gameArea;
    }
    
}());