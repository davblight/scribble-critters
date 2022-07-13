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
        loginFunction: function () {
            this.showHome();
        },
    }
})