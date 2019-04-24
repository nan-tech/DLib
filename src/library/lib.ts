import {Database} from '../database/instance'
import * as Resources from '../resource/resource'
import * as Authenticate from "../auth/auth"

declare let window:any;
window.DLib = {
    "Database": Database,
    "Resources": Resources,
    "Authenticate": Authenticate.authenticate
};