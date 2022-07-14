const URL = "http://localhost:8080"

Vue.component('mon', {
    template: `
        <div class="monInfo">
            <div class='monCard'>
                {{ mon.name }} <br>
                <div class='monType'>
                    Type: {{ mon.type }} <br>
                </div>
                <div class='img-stats-container'>
                    <img :src="'/images/' + mon.id + '.jpg'">
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
        selectedMon: {},
        showMon: false,
        battleMons: [],
        monMove: [],
        activeMon: {},
    },
    methods: {
        showHome: function () {
            this.page = "home";
        },
        showLogin: function (){
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
            } else if (response.status = 404) {
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
        getBattle: async function () {
            let response = await fetch(`${URL}/battles/AI/62d05572f0d3d51db735296b`, {
                credentials: "include"
            });
            if (response.status == 200) {
                let data = await response.json();
                console.log(data);
                this.battleMons = data.player.mons;
                this.monMove = data.player.activeMon.learnedMoves
                this.activeMon = data.player.activeMon
                console.log("fetched battlemons")
            } else if (response.status == 404) {
                console.log("battle not found");
            } else {
                console.log("something went wrong while getting the battle", response.status, response)
            }
        }
    },
    created: function () {
        this.getSession();
    }
})