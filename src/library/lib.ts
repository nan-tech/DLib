import {Database} from '../database/instance'
import {Resource} from '../resource/resource'

declare let window:any;
window.DLib = {
    "Database": Database,
    "Resource": Resource
};