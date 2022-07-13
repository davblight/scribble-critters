const URL = "http://localhost:8080"

var app = new Vue({
    el: "#app",
    data: {
        page: "login",
        subpage: "",
        usernameInput: "",
        passwordInput: "",
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
        },
        showSettings: function () {
            this.subpage = "settings";
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

            let body = response.json();
            console.log(body);

            if (response.status == 201) {
                console.log("successful login attempt");
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
                username: this.nameInput,
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
    },
    created: function () {
        this.getSession();
    }
})