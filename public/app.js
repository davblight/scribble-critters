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
        allMons: "",
        allMoves: {},
        selectedMon: {},
        showMon: false,
        battleMons: [],
        monMove: [],
        activeMon: "",
        AIMon: "",
        userTeams: [],
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
            this.getBattle();
        },
        showPlay: function () {
            this.subpage = "play";
        },
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
        tbResetFields: function () {
            this.tbErrorMessage = "";
            this.tbNameInput = "";
            this.tbMon = "";
            this.tbLearnedMoves = ["", "", ""];
            this.tbLearnableMoves = [];
            this.tbMoveCounter = 0;
        },
        tbShowMons: function () {
            this.tbView = "mons";
            this.tbResetFields();
            this.getMons();
        },
        tbShowSubmit: function () {
            this.tbView = "tbPost"
        },
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
        tbPushMove: function (move) {
            if (this.tbMoveCounter < 3 && !this.tbLearnedMoves.includes(move.id)) {
                this.tbLearnedMoves.splice(this.tbMoveCounter, 1, move.id);
                this.tbMoveCounter += 1;
            }
        },
        tbSaveMon: function () {
            let newMon = {
                name: this.tbNameInput,
                id: this.tbMon.id,
                learnedMoves: [...this.tbLearnedMoves]
            }
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
        },
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
        tbDisplaySavedMon: function (mon) {
            this.tbMon = mon;
            this.tbLearnedMoves = mon.learnedMoves;
            this.tbNameInput = mon.name;
        },
        tbViewTeam: function (team) {
            this.tbWorkingTeam = team.mons;
            this.tbView = "mons";
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

            let body = await response.json();
            console.log(body);

            if (response.status == 201) {
                console.log("successful login attempt");
                this.loggedInUser = body.user.username;
                this.page = "home"
            } else if (response.status = 401) {
                console.log("unsuccessful login attempt");
            } else {
                console.log("something went wrong while posting /session", response.status, response)
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
            } else if (response.status == 404) {
                console.log("error creating user");
            } else {
                console.log("unknown error posting /users", response.status, response);
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
        getBattle: async function () {
            let response = await fetch(`${URL}/battles/AI/62d6e0937fa9e2566be4bff9`, {
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                console.log(data);
                this.battleMons = data.player.mons;
                this.monMove = data.player.activeMon.learnedMoves
                this.activeMon = data.player.activeMon.id
                this.AIMon = data.AI.activeMon.id
                console.log("fetched battlemons")
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while getting the battle", response.status, response)
            }
        },
        putBattle: async function (action, subject) {
            let response = await fetch(`${URL}/battles/AI/62d6e0937fa9e2566be4bff9`, {
                credentials: "include",
                body: {
                    action: action,
                    subject: subject,
                }
            });
            if (response.status == 200) {
                let data = await response.json();
                this.battleMons = data.player.mons;
                this.monMove = data.player.activeMon.learnedMoves
                this.activeMon = data.player.activeMon.id
                this.AIMon = data.AI.activeMon.id
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while putting the battle", response.status, response)
            }
        }
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
        getTeams: async function () {
            let response = await fetch(`${URL}/user/teams`, {
                credentials: "include"
            });
            if (response.status == 200) {
                this.userTeams = await response.json();
                console.log(this.userTeams);
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
        }
    },
    created: function () {
        this.getSession();
    }
})