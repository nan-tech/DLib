import * as firebase from 'firebase/app';
import 'firebase/firestore';

export const Database = (function(){

    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyA2UDNIbN1dQ_RS_Pc2Y0LfZa7_l8i3-Rc",
        authDomain: "nan-tech-displacement-database.firebaseapp.com",
        databaseURL: "https://nan-tech-displacement-database.firebaseio.com",
        projectId: "nan-tech-displacement-database",
        storageBucket: "nan-tech-displacement-database.appspot.com",
        messagingSenderId: "126845761108"
    };

    // Ensure that the app is initilized before any database members become visible
    firebase.initializeApp( FIREBASE_CONFIG );

    let instance: firebase.firestore.Firestore;
    function createInstance()
    {
        instance = firebase.firestore();
    }

    return {
        getInstance: () => {
            if( instance === undefined )
                createInstance();
            return instance;
        }
    }
})();