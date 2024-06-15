import Keycloak from "keycloak-js"; 

let initOptions = {
    url: 'http://www.envzta.com:8000/',   
    realm: 'react-keycloak',
    clientId: 'reactClient'
}

export  var keycloak = new Keycloak(initOptions);