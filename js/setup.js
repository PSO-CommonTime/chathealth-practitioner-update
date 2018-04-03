var username = localStorage.username;
var password = localStorage.password;

var state = {
    token: "nktest",
    redirect: "http://localhost:9998/"
};

var config = {

    rest: {

        baseUri: "https://lhischata1.cti-paging.com:8443/chathealth/"
    },

    idp: {
        baseUri: "https://id.leics-his.co.uk/",

        // ChatHealth Practitioner Console
        // clientId: "dc35ab8a03500a4a75756664278d4481383e61e2c43fb9a78c0bf8a66fdf746f",
        // clientSecret: "eab95a1a758900744369d60c7ddfe35557f70341eeef8bed952b9c82b68155f9",
        // redirectUri: "http://localhost:9998/",

        // CommonTime Nick Test
        clientId: "8cd5324fa2ad88074e85ed1fe0fe39bd68df5eaa177a43cf548d1c7657b4af24",
        clientSecret: "fa352157842dda46e7124af569ccc0601958e0ff74875846b534d737aef60633",
        redirectUri: "http://35.176.204.60:8080/nicktest",

        authorizationUri: "oauth/authorize",
        accessTokenUri: "oauth/token",
        profileLookupUri: "me",

        state: btoa(JSON.stringify(state))
    },

    useIdp: true
}

if (username && password) {

    config.user = {
        name: username,
        password: password
    };
}

window.wc = new ClientManager("wc", "body", config);
