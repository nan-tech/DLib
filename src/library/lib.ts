import {Database} from '../database/instance'
import * as Resources from '../resource/resource'

declare let window:any;
window.DLib = {
    "Database": Database,
    "Resources": Resources
};