const URL = "http://localhost:8080"

Vue.component('thread-preview', {
    template: `<div class="thread-preview">
        <div class="thread-preview-header">
            <h1 @click="goToThread()"> {{ thread.name }} </h1>
            <h3> {{ thread.category }} </h3>
            <button @click="remove()">Delete</button>
        </div>
        <p> {{ thread.description }} </p>
    </div>`,
    props: ['thread'],
    methods: {
        goToThread: function () {
            this.$emit('go')
        },
        remove: function () {
            this.$emit('remove')
        }
    }
});

Vue.component('post', {
    template: `
    <div class="post">
        <p> {{ post.body }} </p>
        <div class="post-footer">
            <h3> {{ post.user.fullname }} </h3>
            <button @click="deletePost()">Delete Comment</button>
            <p> {{ post.errorMessage }} </p>
        </div>
    </div>`,
    props: ['post'],
    methods: {
        deletePost: function () {
            this.$emit('deletecomment')
        }
    },
});

var app = new Vue({
    el: '#app',
    data: {
        page: "login",
        loginEmail: "",
        loginPassword: "",

        newUsername: "",
        newEmail: "",
        newPassword: "",

        errorMessage: "",
        accountMessage: "",

        threadList: [],
        activeThread: {
            fullname: "",
        },

        newThreadName: "",
        newThreadCat: "",
        newThreadDesc: "",

        comment: "",
    },
    methods: {

        //Get /session - ask the server if we are logged in
        getSession: async function () {
            let response = await fetch(`${URL}/session`, {
                method: "GET",
                credentials: "include"
            });
            //Are we logged in?
            if (response.status == 200) {
                //logged in
                this.page = "home"
                this.getThread()
            }
            else if (response.status == 401) {
                //not logged in
                let data = await response.json();
                console.log(data);
                this.page = "login"
            }
            else {
                console.log("Error GETTING /session", response.status, response);
            }
        },
        postSession: async function () {
            let loginCreds = {
                username: this.loginEmail,
                password: this.loginPassword
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
                //logged in

                this.loginEmail = "";
                this.loginPassword = "";
                this.errorMessage = "";
                this.goToHome();
            }
            else if (response.status == 401) {
                //not logged in
                this.loginPassword = "";
                this.errorMessage = "Incorrect username or password";
            }
            else if (response.status == 400) {
                //no info entered
                this.loginPassword = "";
                this.errorMessage = "Please enter a username and password";
            }
            else {
                console.log("Error POSTING /session", response.status, response);
            }
        },

        postUser: async function () {
            let loginCreds = {
                fullname: this.newUsername,
                username: this.newEmail,
                password: this.newPassword
            };

            let response = await fetch(`${URL}/users`, {
                method: "POST",
                body: JSON.stringify(loginCreds),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"

            });
            console.log(response);

            if (response.status == 201) {
                this.accountMessage = "Account created. You may now login";
                this.page = "login";
                this.loginEmail = "";
                this.loginPassword = "";
                this.errorMessage = "";
            }
            else {
                let body = await response.json();
                this.errorMessage = body.error.message;
            }
        },
        getThread: async function () {
            let response = await fetch(`${URL}/thread`, {
                method: "GET",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.threadList = data;
                this.threadList.forEach(thread => {
                    thread.errorMessage = "";
                });
            }
            else {
                this.threadList = ["ERROR FETCHING THREAD DATA"]
            }
        },
        getThreadID: async function (id) {
            let response = await fetch(`${URL}/thread/${id}`, {
                method: "GET",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.activeThread = data;
                this.activeThread.posts.forEach(post => {
                    post.errorMessage = "";
                })
            }
            else {
                this.activeThread = ["ERROR FETCHING THREAD DATA"]
            }
        },
        postThread: async function () {
            let newThread = {
                name: this.newThreadName,
                category: this.newThreadCat,
                description: this.newThreadDesc,
            };
            let response = await fetch(`${URL}/thread`, {
                method: "POST",
                body: JSON.stringify(newThread),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
            });
            if (response.status == 201) {
                let data = await response.json();
                this.goToThread(data._id);
            }
            else {
                let body = await response.json();
                this.errorMessage = body.error.message;
                console.log(newThread);
            }
        },
        postPost: async function () {
            let newPost = {
                body: this.comment,
                thread_id: this.activeThread._id,
            }
            let response = await fetch(`${URL}/post`, {
                method: "POST",
                body: JSON.stringify(newPost),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
            });
            if (response.status == 201) {
                let data = await response.json();
                this.goToThread(data.thread_id);
            }
            else {
                let body = await response.json();
                this.errorMessage = body.error.message;
            }
        },
        deletePost: async function (id) {
            let currentPost = {};
            this.activeThread.posts.forEach(post => {
                if (post._id == id) {
                    currentPost = post;
                }
            })
            let response = await fetch(`${URL}/thread/${this.activeThread._id}/post/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.goToThread(data._id);
            }
            else {
                let body = await response.json();
                currentPost.errorMessage = body;
            }
        },
        deleteThread: async function (id) {
            let response = await fetch(`${URL}/thread/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.goToHome();
            }
            else {
                let body = await response.json();
                currentPost.errorMessage = body;
            }
        },

        patchThreadStatus: async function (closeBool) {
            let response = await fetch(`${URL}/thread/${this.activeThread._id}/${closeBool}`, {
                method: "PATCH",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.goToThread(data._id);
            }
            else {
                let body = await response.json();
                errorMessage = body;
            }
        },

        goToSignUp: function () {
            this.page = 'signup';
            this.errorMessage = ''
            this.loginEmail = "";
            this.loginPassword = "";
        },
        goToLogin: function () {
            this.page = 'login';
            this.errorMessage = '';
            this.newUsername = ""
            this.newEmail = "";
            this.newPassword = "";
        },
        goToThread: async function (id) {
            await this.getThreadID(id);
            this.page = "thread";
            this.comment = ""
            this.errorMessage = '';
        },
        goToHome: function () {
            this.getThread();
            this.errorMessage = '';
            this.activeThread = {};
            this.page = "home"
            this.newThreadName = "";
            this.newThreadCat = "";
            this.newThreadDesc = "";
        },
        goToNewThread: function () {
            this.page = "newThread"
            this.errorMessage = '';
        }

    },
    computed: {
        fullname: function () {
            return this.activeThread.user.fullname
        }
    },
    created: function () {
        this.getSession();
    }
});