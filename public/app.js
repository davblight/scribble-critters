const URL = "http://localhost:8080"


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
                <div class='monMoves' v-for='move in mon.learnableMoves'>
                    {{ move }}
                </div>
            </div>
        </div>`,
    props: [
        "mon"
    ],
    data: function () {
        return {
            showMon: false,
        }
    },
    methods: {
        showMonInfo: function () {
            this.showMon = !this.showMon
        }
    }
})

var app = new Vue({
    el: "#app",
    data: {
        page: "login",
        subpage: "",
        usernameInput: "",
        passwordInput: "",
        loggedInUser: "",
        loginErrorMessage: "",
        allMons: "",
        allMoves: {},
        selectedMon: {},
        showMon: false,
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
        //All tb variables should only be used in the scope of the teambuilder
        tbMon: "",
        tbMoves: [],
        tbView: "",
        tbLearnableMoves: [],
        tbLearnedMoves: ["", "", ""],
        tbMoveCounter: 0,
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
            this.page = "home";
        },
        showLogin: function () {
            this.page = "login";
            this.subpage = "";
        },
        showBattle: function () {
            this.page = "battle";
        },
        showPlay: function () {
            this.subpage = "play";
            this.getTeams();
            this.getAITeams();
        },
        // Shows Teambuilder and cleans it up in case you're clicking on Teambuilder from Teambuilder itself
        showTeambuilder: function () {
            this.subpage = "teambuilder";
            this.tbView = 'existingTeams'
            this.tbResetFields();
            this.tbWorkingTeam = [];
            this.getTeams();
        },
        showChat: function () {
            this.subpage = "chat";
        },
        // Shows compendium and gets mons to populate said compendium
        showCompendium: function () {
            this.subpage = "compendium";
            this.getMons();
        },
        showSettings: function () {
            this.subpage = "settings";
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
        // All tb functions should only be used in the scope of the teambuilder
        // Resets fields to clean up teambuilder
        tbResetFields: function () {
            this.tbErrorMessage = "";
            this.tbNameInput = "";
            this.tbMon = "";
            this.tbLearnedMoves = ["", "", ""];
            this.tbLearnableMoves = [];
            this.tbMoveCounter = 0;
        },
        // Shows all mons available to be added to team
        tbShowMons: function () {
            this.tbView = "mons";
            this.tbResetFields();
            this.getMons();
        },
        tbShowSubmit: function () {
            this.tbView = "tbPost"
        },
        // Sets the active mon and populates the move fields with the moves already assigned to said mon.
        tbSetMon: async function (mon) {
            this.tbLearnedMoves = ["", "", ""];
            this.tbMon = mon;
            this.tbNameInput = mon.name
            await this.getMoves();
            mon.learnableMoves.forEach((move) => {
                this.tbLearnableMoves.push(this.allMoves[move])
            })
            this.tbView = "moves";
        },
        // Adds the selected moves to the mon's learnedMoves field
        tbPushMove: function (move) {
            if (this.tbMoveCounter < 3 && !this.tbLearnedMoves.includes(move.id)) {
                this.tbLearnedMoves.splice(this.tbMoveCounter, 1, move.id);
                this.tbMoveCounter += 1;
            }
        },
        // Saves the mon when the button is clicked so that they can eventually be present when a team is posted
        tbSaveMon: function () {
            let newMon = {
                name: this.tbNameInput,
                id: this.tbMon.id,
                learnedMoves: [...this.tbLearnedMoves]
            }
            if (this.tbIsNewTeam == true) {
                if (this.tbWorkingTeam.length < 3) {
                    if (this.tbNameInput != "" && !this.tbLearnedMoves.includes("")) {
                        this.tbWorkingTeam.push(newMon)
                        //Clean up the teambuilder for the next mon to be input
                        this.tbResetFields();
                        this.tbView = "mons";
                    } else {
                        this.tbErrorMessage = "Please fill out all fields.";
                    }
                } else {
                    this.tbErrorMessage = "Only 3 Mons allowed.";
                }
            } else {
                this.tbWorkingTeam[this.tbIndex] = newMon
                this.tbResetFields();
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
            if (!this.tbWorkingTeam.includes("") && this.tbTeamNameInput != "") {
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
                } else {
                    console.log("error posting team", response.status, response)
                }
            } else {
                this.tbErrorMessage = "Please draw a full team of 3."
            }
        },
        // Edits existing team -- called by tbSubmit
        tbPutTeam: async function () {
            if (!this.tbWorkingTeam.includes("") && this.tbTeamNameInput != "") {
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
                } else {
                    console.log("error posting team", response.status, response)
                }
            } else {
                this.tbErrorMessage = "Please draw a full team of 3."
            }
        },
        // Displays a saved mon. Intended for use on existing mons from existing teams
        tbDisplaySavedMon: function (mon, index) {
            this.tbMon = mon;
            this.tbLearnedMoves = mon.learnedMoves;
            this.tbNameInput = mon.name;
            this.tbIndex = index;
        },
        //Allows user to view an existing team by loading that team's data into the tbWorkingTeam variable
        tbViewTeam: function (team) {
            this.tbWorkingTeam = team.mons;
            this.tbView = "mons";
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
                let body = response.json();
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
        getBattle: async function (battle_id) {
            let response = await fetch(`${URL}/battles/AI/${battle_id}`, {
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                console.log(data);
                this.battleMons = data.player.mons;
                this.monMove = data.player.activeMon.learnedMoves
                this.activeMon = data.player.activeMon
                this.AIMon = data.AI.activeMon
                this.battleTurns = data.turns
                this.battleId = battle_id
                console.log("fetched battlemons")
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while getting the battle", response.status, response)
            }
        },
        putBattle: async function (putAction, putSubject) {
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
                this.battleMons = data.player.mons;
                this.monMove = data.player.activeMon.learnedMoves
                this.activeMon = data.player.activeMon
                this.AIMon = data.AI.activeMon
                this.battleTurns = data.turns
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while putting the battle", response.status, response)
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
                this.getBattle(body._id)
                this.showBattle();
            } else {
                console.log("error posting battle", response.status, response)
            }
        }
    },
    created: function () {
        this.getSession();
    }
})