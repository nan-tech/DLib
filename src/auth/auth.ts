import firebase from 'firebase/app';
import 'firebase/auth';

export function authenticate() {
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then(function(result) {
        console.log("Authenticated user");
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error("Could not authenticate user. " + errorCode + ": " + errorMessage);
    });
}