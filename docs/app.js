const URL = "http://localhost:8080"

Vue.component('move', {
    template: `
    <div class="compendiumMoveContainer">
        <p @mouseover="mouseOverMove($event)" @mouseout="mouseOff">{{ move }}</p>
        <div class=mouseOverMoves :style=hoverStyle>
            Type: {{ allMoves[move].type }}<br>
            Power: {{ allMoves[move].power }}<br>
            Stamina: {{ allMoves[move].staminaCost }}<br>
            Effect: {{ allMoves[move].effect }}
        </div>
    </div>`,
    props: [
        "move",
        "all-moves"
    ],
    data: function () {
        return {
            hoverStyle: {
                display: "none",
            },
        }
    },
    methods: {
        mouseOverMove: function (event) {
            this.hoverStyle = {
                left: event.clientX,
                top: event.clientY,
                display: "block",
            };
            this.showMove = true;
        },
        mouseOff: function () {
            this.hoverStyle = {
                display: "none"
            }
        }
    }
})

//Mon component for the display of mons in the Compendium
Vue.component('mon', {
    template: `
        <div class="monInfo">
            <div class='monCard'>
                {{ mon.name }} <br>
                <div class='monType'>
                    Type: {{ mon.type }} <br>
                </div>
                <div class='img-stats-container'>
                    <img :src="'/images/' + mon.id + '.png'">
                    <div class='monStats'>
                        HP: {{ mon.stats.hp }} <br>
                        STA: {{ mon.stats.stamina }} <br>
                        ATK: {{ mon.stats.attack }} <br>
                        DEF: {{ mon.stats.defense }} <br>
                        SPD: {{ mon.stats.speed }}
                    </div>
                </div> <br>
                MOVES:
                <div class='monMoves' v-for='move in mon.learnableMoves' >
                    <move :all-moves="allMoves" :move="move"></move>
                </div>
            </div>
        </div>`,
    props: [
        "mon",
        "all-moves"
    ],
    data: function () {
        return {
            showMon: false,
            showMove: false,
            hoverStyle: {
                display: "none",
                left: 0,
                top: 0,
            },
        }
    },
    methods: {
        showMonInfo: function () {
            this.showMon = !this.showMon;
        },
    }
})

var app = new Vue({
    el: "#app",
    data: {
        page: "login",
        subpage: "",
        subpageStyle: {},
        usernameInput: "",
        passwordInput: "",
        loggedInUser: "",
        loginErrorMessage: "",
        allMons: "",
        allMoves: {},
        selectedMon: {},
        showMon: false,
        tbShowButtons: "default",
        battleMons: [],
        monMove: [],
        activeMon: "",
        AIMon: "",
        userTeams: [],
        battleTurns: [],
        AITeams: [],
        playView: "",
        playerTeam: "",
        AITeam: "",
        battleId: "",
        battle: {},
        canTakeAction: true,
        playerHover: false,
        AIHover: false,
        playerHoverX: 0,
        playerHoverY: 0,
        battleHoverStyle: {},
        playerAnimation: {},
        AIAnimation: {},
        gameOverStyle: {},
        showWarning: false,
        warningSubpage: "",
        userStats: {},
        //All tb variables should only be used in the scope of the teambuilder
        tbMon: "",
        tbMoves: [],
        tbView: "",
        tbLearnableMoves: [],
        tbLearnedMoves: [],
        tbWorkingTeam: [],
        tbNameInput: "",
        tbErrorMessage: "",
        tbTeamNameInput: "",
        tbIsNewTeam: true,
        tbWorkingTeamID: "",
        tbIndex: 0,
    },
    methods: {
        showHome: function () {
            this.subpage = "";
            this.page = "home";
            this.playView = "";
        },
        showLogin: function () {
            this.page = "login";
            this.subpage = "";
        },
        showBattle: function () {
            this.page = "battle";
            this.gameOverStyle = {};
            this.playerAnimation = {};
            this.AIAnimation = {};
        },
        showPlay: function () {
            this.playView = "";
            this.playerTeam = "";
            this.AITeam = "";
            this.tbShowWarning('play');
            if (this.showWarning == false) {
                this.getTeams();
                this.getAITeams();
            }
        },
        // Shows Teambuilder and cleans it up in case you're clicking on Teambuilder from Teambuilder itself
        showTeambuilder: function () {
            this.tbShowWarning('teambuilder')
            if (this.showWarning == false) {
                this.tbResetFields();
                this.tbView = 'existingTeams'
                this.tbShowButtons = "default";
                this.tbIsNewTeam = true;
                this.getTeams();
                this.tbWorkingTeam = [];
            }
        },
        showChat: function () {
            this.tbShowWarning('chat')
        },
        // Shows compendium and gets mons to populate said compendium
        showCompendium: function () {
            this.tbShowWarning('compendium');
            if (this.showWarning == false) {
                this.getMons();
                this.getMoves();
                this.showMon = false;
            }
        },
        showStats: function () {
            this.tbShowWarning('stats');
            if (this.showWarning == false) {
                this.getStats();
            }
        },
        // Sets up transition so that subpages slide in
        subpageTransition: function (page) {
            this.subpageStyle = {
                "margin-left": "100%",
            };
            if (this.subpage != "") {
                setTimeout(() => {
                    this.subpage = page
                }, 350)
                setTimeout(() => {
                    this.subpageStyle = {};
                }, 700)
            } else {
                this.subpage = page
                setTimeout(() => {
                    this.subpageStyle = {};
                }, 10)
            }
        },
        showMonInfo: function (mon) {
            this.showMon = true;
            this.selectedMon = mon;
        },
        playViewAI: function () {
            this.playView = "AI";
        },
        playViewHuman: function () {
            this.playView = "human";
        },
        playerHoverOver: function (event) {
            this.playerHover = true;
            let x = event.screenX;
            let y = event.screenY;
            this.battleHoverStyle = {
                left: x,
                top: y,
            }
        },
        AIHoverOver: function (event) {
            this.AIHover = true;
            let x = event.screenX;
            let y = event.screenY;
            this.battleHoverStyle = {
                left: x,
                top: y,
            }
        },
        // All tb functions should only be used in the scope of the teambuilder
        // Resets fields to clean up teambuilder
        tbResetFields: function () {
            this.tbErrorMessage = "";
            this.tbNameInput = "";
            this.tbMon = "";
            this.tbLearnedMoves = [];
            this.tbLearnableMoves = [];
        },
        // Shows all mons available to be added to team
        tbShowMons: function () {
            if (this.userTeams.length != 3) {
                if (this.tbShowButtons == "default" || this.tbShowButtons == "edit") {
                    this.tbView = "mons";
                    this.tbResetFields();
                    this.getMons();
                }
            } else {
                this.tbErrorMessage = "You may only have a maximum of three teams"
            }
        },
        tbShowSubmit: function () {
            this.tbView = "tbPost"
        },
        tbNewMon: function () {
            this.tbView = "mons";
            this.tbResetFields();
            this.tbShowButtons = "default";
        },
        // Sets the active mon and populates the move fields with the moves already assigned to said mon.
        tbSetMon: async function (mon) {
            if (this.tbShowButtons == "default" || this.tbShowButtons == "edit") {
                this.tbLearnedMoves = [];
                this.tbMon = mon;
                this.tbNameInput = mon.name
                await this.getMoves();
                mon.learnableMoves.forEach((move) => {
                    this.tbLearnableMoves.push(this.allMoves[move])
                })
                this.tbView = "moves";
            }
        },
        // Adds the selected moves to the mon's learnedMoves field
        tbPushMove: function (move) {
            if (this.tbLearnedMoves.length < 3 && !this.tbLearnedMoves.includes(move.id)) {
                this.tbLearnedMoves.push(move.id);
            }
        },
        // Removes the selected move from the mon's learnedMoves field
        tbDeleteMove: function (index) {

            if (this.tbShowButtons == "default" || this.tbShowButtons == "edit") {
                this.tbLearnedMoves.splice(index, 1);
                this.tbView = "moves";
            }
        },
        // Saves the mon when the button is clicked so that they can eventually be present when a team is posted
        tbSaveMon: function () {
            let newMon = {
                name: this.tbNameInput,
                id: this.tbMon.id,
                learnedMoves: [...this.tbLearnedMoves]
            }
            if (this.tbShowButtons == "edit") {
                if (this.tbNameInput != "" && this.tbLearnedMoves.length == 3) {
                    this.tbWorkingTeam[this.tbIndex] = newMon
                    this.tbView = "";
                    this.tbShowButtons = "show";
                    this.tbErrorMessage = "";
                } else {
                    this.tbErrorMessage = "Please fill out all fields.";
                }
            }
            else if (this.tbWorkingTeam.length < 3) {
                if (this.tbNameInput != "" && this.tbLearnedMoves.length == 3) {
                    this.tbWorkingTeam.push(newMon)
                    //Clean up the teambuilder for the next mon to be input
                    this.tbView = "";
                    this.tbShowButtons = "show";
                    this.tbErrorMessage = ""
                } else {
                    this.tbErrorMessage = "Please fill out all fields.";
                }
            } else {
                this.tbErrorMessage = "Only 3 Mons allowed.";
            }


        },
        // Checks if this is a new team or existing team, then performs the appropriate PUT or POST method
        tbSubmit: function () {
            if (this.tbIsNewTeam == false) {
                this.tbPutTeam();
            } else {
                this.tbPostTeam();
            }
        },
        // Posts a new team -- called by tbSubmit
        tbPostTeam: async function () {
            if (this.tbWorkingTeam.length == 3 && this.tbTeamNameInput != "") {
                let newTeam = {
                    name: this.tbTeamNameInput,
                    mons: this.tbWorkingTeam
                }
                let response = await fetch(`${URL}/teams`, {
                    method: "POST",
                    body: JSON.stringify(newTeam),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });

                let body = response.json();
                console.log(body);

                if (response.status == 201) {
                    console.log("team successfully posted");
                    await this.getTeams();
                    this.tbView = "existingTeams";
                } else {
                    console.log("error posting team", response.status, response)
                }
                this.tbTeamNameInput = "";
                this.tbResetFields();
                this.tbView = 'existingTeams'
                this.tbShowButtons = "default";
                this.tbIsNewTeam = true;
                this.getTeams();
                this.tbWorkingTeam = [];
            } else {
                this.tbErrorMessage = "Please enter a team name."
            }
        },
        // Edits existing team -- called by tbSubmit
        tbPutTeam: async function () {
            if (this.tbWorkingTeam.length == 3 && this.tbTeamNameInput != "") {
                let newTeam = {
                    name: this.tbTeamNameInput,
                    mons: this.tbWorkingTeam
                }
                let response = await fetch(`${URL}/team/${this.tbWorkingTeamID}`, {
                    method: "PUT",
                    body: JSON.stringify(newTeam),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });

                let body = response.json();
                console.log(body);

                if (response.status == 201) {
                    console.log("team successfully posted");
                    await this.getTeams();
                    this.tbView = "existingTeams";
                    this.tbIsNewTeam = true;

                } else {
                    console.log("error posting team", response.status, response)
                }
                this.tbWorkingTeam = [];
                this.tbResetFields();
                this.tbView = 'existingTeams'
                this.tbShowButtons = "default";
                this.tbIsNewTeam = true;
                this.getTeams();
                this.tbWorkingTeam = [];
            } else {
                this.tbErrorMessage = "Please enter a team name."
            }
        },
        // Displays a saved mon. Intended for use on existing mons from existing teams
        tbDisplaySavedMon: async function (mon, index) {
            if (this.tbShowButtons != "edit") {
                this.tbResetFields();
                this.tbMon = mon;
                this.tbLearnedMoves = [...mon.learnedMoves];
                this.tbNameInput = mon.name;
                this.tbIndex = index;
                this.tbShowButtons = "show";
                editMon = this.allMons[mon.id];
                editMon.learnableMoves.forEach((move) => {
                    this.tbLearnableMoves.push(this.allMoves[move])
                });
            }
        },
        tbEditMon: function () {
            this.tbShowButtons = "edit";
            this.tbView = "";
        },
        tbEditCancel: function () {
            this.tbShowButtons = "show";
            this.tbView = "";
            index = this.tbWorkingTeam.length - 1;
            this.tbDisplaySavedMon(this.tbWorkingTeam[index], index);
        },
        //Allows user to view an existing team by loading that team's data into the tbWorkingTeam variable
        tbViewTeam: function (team) {
            this.tbWorkingTeam = team.mons;
            this.tbTeamNameInput = team.name;
            this.tbView = "";
            this.tbShowButtons = "show";
            index = this.tbWorkingTeam.length - 1;
            this.tbDisplaySavedMon(this.tbWorkingTeam[index], index);
            // If this function is called, you're editing an existing team, thus PUT should be called rather than POST
            this.tbIsNewTeam = false;
            // Sets the tbWorkingTeamID variable for use in the PUT function
            this.tbWorkingTeamID = team._id;
        },

        //USER LOGIN AND AUTHENTICATION LOGIC
        //First, see if we're logged in
        getSession: async function () {
            let response = await fetch(`${URL}/session`, {
                credentials: "include"
            });
            if (response.status == 200) {
                console.log("logged in");
                let data = await response.json();
                this.loggedInUser = data.user.username;
                console.log(data);
                this.page = "home";
            } else if (response.status == 401) {
                console.log("not logged in");
                let data = await response.json();
                console.log(data);
            } else {
                console.log("Something went wrong while getting /session", response.status, response)
            }
        },
        //Attempt to log in
        postSession: async function () {
            let loginCreds = {
                username: this.usernameInput,
                password: this.passwordInput
            };
            let response = await fetch(`${URL}/session`, {
                method: "POST",
                body: JSON.stringify(loginCreds),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            if (response.status == 201) {
                console.log("successful login attempt");
                let body = await response.json();
                this.loggedInUser = body.user.username;
                this.page = "home"
            } else if (response.status == 401) {
                console.log("unsuccessful login attempt");
                this.loginErrorMessage = "Wrong Username/Password. Are you trying to sign up?"
            } else {
                console.log("something went wrong while posting /session", response.status, response)
                this.loginErrorMessage = "Something went wrong while logging in."
            }
        },
        //Create new user
        postUser: async function () {
            let newUser = {
                username: this.usernameInput,
                password: this.passwordInput
            };
            let response = await fetch(`${URL}/users`, {
                method: "POST",
                body: JSON.stringify(newUser),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            let body = response.json();
            console.log(body);

            if (response.status == 201) {
                console.log("user successfully created");
                this.loginErrorMessage = "User created!"
            } else if (response.status == 404) {
                console.log("error creating user");
                this.loginErrorMessage = "Error creating user (user not found)"
            } else {
                console.log("unknown error posting /users", response.status, response);
                this.loginErrorMessage = "Something went wrong, creating a user."
            }
        },
        getMons: async function () {
            let response = await fetch(`${URL}/mons`, {
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                this.allMons = data;
                console.log("fetched all mons");
            } else if (response.status == 404) {
                console.log("mons not found");
            } else {
                console.log("something went wrong while getting mons", response.status, response)
            }
        },
        getMoves: async function () {
            let response = await fetch(`${URL}/moves`, {
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                this.allMoves = data;
                console.log("fetched all moves");
            } else {
                console.log("something went wrong while getting moves", response.status, response)
            }
        },
        setMonStats: function (mon) {
            mon.maxHP = mon.stats.hp * 12;
            mon.percentHP = (mon.currentHP / mon.maxHP * 100) + "px";
            mon.percentStamina = (mon.currentStamina / mon.stats.stamina * 100) + "px";
            return mon;
        },
        setBattleData: function (battle) {
            battle.player.mons.forEach(mon => {
                if (battle.player.activeMon._id.toString() == mon._id.toString() && battle.player.activeMon.status != "dead") {
                    mon.class = "activeMon";
                } else if (mon.status == "dead") {
                    mon.class = "unavailableMon";
                } else {
                    mon.class = "mon";
                }
            });
            battle.player.activeMon.learnedMoves.forEach(move => {
                if (!move.monHasStamina || battle.player.activeMon.status == "dead") {
                    move.class = "unavailableMove";
                } else {
                    move.class = "move";
                }
            });
            this.battleMons = battle.player.mons;
            this.monMove = battle.player.activeMon.learnedMoves;
            this.activeMon = battle.player.activeMon;
            this.activeMon = this.setMonStats(this.activeMon);
            this.AIMon = battle.AI.activeMon;
            this.AIMon = this.setMonStats(this.AIMon);
            this.battleTurns = battle.turns;
            this.battleId = battle._id;
            this.battle = battle;
        },
        getBattle: async function (battle_id) {
            let response = await fetch(`${URL}/battles/AI/${battle_id}`, {
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                console.log(data);
                this.setBattleData(data);
                console.log("fetched battlemons")
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while getting the battle", response.status, response)
            }
        },
        takeAction: function (action, subject) {
            if (!this.battle.finished && this.canTakeAction) {
                if (action == "fight" && this.activeMon.status != "dead") {
                    this.monMove.forEach(move => {
                        if (move.id == subject) {
                            if (move.monHasStamina) {
                                this.putBattle(action, subject);
                            }
                        }
                    })
                } else if (action == "switch") {
                    this.battleMons.forEach(mon => {
                        if (mon._id == subject) {
                            if (mon.status != "dead" && mon._id != this.activeMon._id) {
                                this.putBattle(action, subject);
                            }
                        }
                    })
                } else if (this.activeMon.status != "dead" || action == "forfeit") {
                    this.putBattle(action, subject);
                }
            }
        },
        putBattle: async function (putAction, putSubject) {
            this.canTakeAction = false;
            let response = await fetch(`${URL}/battles/AI/${this.battleId}`, {
                method: "PUT",
                credentials: "include",
                body: JSON.stringify({
                    action: putAction,
                    subject: putSubject,
                }),
                headers: {
                    "Content-Type": "application/json"
                },
            });
            if (response.status == 200) {
                let data = await response.json();
                this.animate(data)
                setTimeout(() => {
                    this.setBattleData(data)
                    this.canTakeAction = true;
                    setTimeout(() => {
                        this.scrollToElement();
                    }, 10);
                }, 1100);
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while putting the battle", response.status, response)
                this.canTakeAction = true;
            }
        },
        postTeam: async function () {
            let response = await fetch(`${URL}/teams`, {
                method: "POST",
                body: JSON.stringify(this.tbWorkingTeam),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            let body = response.json();
            console.log(body);

            if (response.status == 201) {
                console.log("team posted successfully");
                this.tbWorkingTeam = [];
            } else {
                console.log("error posting team", response.status, response)
            }
        },
        // This function is only utilized by the teambuilder
        getTeams: async function () {
            let response = await fetch(`${URL}/user/teams`, {
                credentials: "include"
            });
            if (response.status == 200) {
                this.userTeams = await response.json();
                console.log(this.userTeams);
            }
        },
        getAITeams: async function () {
            let response = await fetch(`${URL}/AI/teams`, {
                credentials: "include"
            });
            if (response.status == 200) {
                this.AITeams = await response.json();
                console.log(this.AITeams);
            }
        },
        deleteTeam: async function (team_id) {
            let response = await fetch(`${URL}/team/${team_id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                console.log(data);
                this.getTeams();
            } else {
                console.log("error while deleting team", response.status, response)
            }
        },
        postAIBattle: async function () {
            let newBattle = {
                playerTeamId: this.playerTeam,
                AITeamId: this.AITeam,
            };
            let response = await fetch(`${URL}/battles/AI`, {
                method: "POST",
                body: JSON.stringify(newBattle),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            let body = await response.json();
            console.log(body);

            if (response.status == 201) {
                console.log("Battle successfully created");
                await this.getBattle(body._id)
                this.showBattle();
            } else {
                console.log("error posting battle", response.status, response)
            }
        },
        logOut: async function () {
            let response = await fetch(`${URL}/session`, {
                method: "DELETE",
                credentials: "include"
            });
            if (response.status == 204) {
                console.log("User successfully logged out");
                this.subpage = ""
                this.tbResetFields();
                this.page = 'login';
                this.usernameInput = "";
                this.passwordInput = "";
                this.loginErrorMessage = "";
            } else {
                console.log("error logging out user", response.status, response);
            }
        },
        hideGameOver: function () {
            if (this.battle.finished) {
                this.gameOverStyle = {
                    "display": "none",
                }
            }
        },
        // Animates the mon sprites based on actions taken by AI or user
        animate: function (battle) {
            let currentTurn = battle.turns[battle.turns.length - 1]
            let animationWait = 10;
            if (currentTurn.turnText[currentTurn.turnText.length - 1].action == "forfeit") {
                this.setBattleData(battle);
            } else if (this.activeMon.currentHP != 0) {

                currentTurn.turnText.forEach(move => {
                    if (move.action == 'fight') {
                        if (move.user == 'player') {
                            setTimeout(() => {
                                this.playerAnimation = {
                                    "margin-left": "100px",
                                };
                            }, animationWait);
                            setTimeout(() => {
                                this.playerAnimation = {}
                                this.activeMon = move.mon1;
                                this.activeMon = this.setMonStats(this.activeMon);
                                this.AIMon = move.mon2;
                                this.AIMon = this.setMonStats(this.AIMon);
                            }, animationWait + 300);
                        } else if (move.user == 'AI') {
                            setTimeout(() => {
                                this.AIAnimation = {
                                    "margin-left": "250px",
                                };
                            }, animationWait);
                            setTimeout(() => {
                                this.AIAnimation = {}
                                this.AIMon = move.mon1;
                                this.AIMon = this.setMonStats(this.AIMon);
                                this.activeMon = move.mon2;
                                this.activeMon = this.setMonStats(this.activeMon);
                                if (this.activeMon.currentHP == 0) {
                                    this.playerAnimation = {
                                        "opacity": "0%",
                                    };
                                }
                            }, animationWait + 300);
                        } else {
                            console.log("Something went wrong -- fight");
                        }
                    } else if (move.action == 'switch') {
                        if (move.user == 'player') {
                            setTimeout(() => {
                                this.playerAnimation = {
                                    "opacity": "0%",
                                };
                            }, animationWait);
                            setTimeout(() => {
                                this.activeMon = move.mon1;
                                this.activeMon = this.setMonStats(this.activeMon);
                                this.playerAnimation = {};
                            }, animationWait + 300);
                        } else if (move.user == 'AI') {
                            setTimeout(() => {
                                this.AIAnimation = {
                                    "opacity": "0%",
                                };
                            }, animationWait);
                            setTimeout(() => {
                                this.AIMon = move.mon1;
                                this.AIMon = this.setMonStats(this.AIMon);
                                this.AIAnimation = {};
                            }, animationWait + 300);
                        } else {
                            console.log("Something went wrong -- switch");
                        }
                    } else if (move.action == 'rest') {
                        if (move.user == 'player') {
                            setTimeout(() => {
                                this.playerAnimation = {
                                    "padding-top": "150px",
                                    "height": "200px",
                                };
                            }, animationWait);
                            setTimeout(() => {
                                this.playerAnimation = {};
                                this.activeMon = move.mon1;
                                this.activeMon = this.setMonStats(this.activeMon);
                            }, animationWait + 300);
                        } else if (move.user == 'AI') {
                            setTimeout(() => {
                                this.AIAnimation = {
                                    "padding-top": "150px",
                                    "height": "200px",
                                };
                            }, animationWait);
                            setTimeout(() => {
                                this.AIAnimation = {};
                                this.AIMon = move.mon1;
                                this.AIMon = this.setMonStats(this.AIMon);
                            }, animationWait + 300);
                        } else {
                            console.log("Something went wrong -- rest");
                        }
                    } else {
                        console.log("Something went wrong -- No if statements entered")
                    }
                    animationWait += 350;
                });
            } else {
                this.activeMon = currentTurn.turnText[currentTurn.turnText.length - 1].mon1;
                this.activeMon = this.setMonStats(this.activeMon);
                this.playerAnimation = {};
            }
        },
        scrollToElement: function () {
            const el = this.$refs.scrollToMe;
            if (el) {
                // Use el.scrollIntoView() to instantly scroll to the element
                el.scrollTop = el.scrollHeight;
            }
        },
        tbShowWarning: function (page) {
            if (this.tbWorkingTeam.length > 0) {
                this.showWarning = true;
                this.warningSubpage = page;
            } else {
                this.subpageTransition(page);
            }
        },
        showWarningCancel: function () {
            this.showWarning = false;
        },
        showWarningContinue: function () {
            this.tbWorkingTeam = [];
            this.showWarning = false;
            this.subpageTransition(this.warningSubpage);
            if (this.warningSubpage == 'teambuilder') {
                setTimeout(() => {
                    this.tbResetFields();
                    this.tbView = 'existingTeams'
                    this.tbShowButtons = "default";
                    this.tbIsNewTeam = true;
                    this.getTeams();
                    this.tbWorkingTeam = [];
                }, 350);
            }
        },
        getStats: async function () {
            let response = await fetch(`${URL}/user/stats`, {
                credentials: "include"
            });
            if (response.status == 200) {
                this.userStats = await response.json();
                console.log("fetched user stats");
            } else {
                console.log("something went wrong getting stats", response.status, response)
            }
        },
    },
    computed: {
        tbShowAdd: function () {
            if (this.tbShowButtons == "show" && this.tbWorkingTeam.length != 3) {
                return true;
            }
            return false;
        },
        tbShowSave: function () {
            if (this.tbWorkingTeam.length == 3 && this.tbShowButtons != "edit") {
                return true;
            } else {
                return false;
            }
        }
    },
    created: function () {
        this.getSession();
    }
})