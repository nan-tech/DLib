import { Database } from '../database/instance';

export class Resource
{
    name: string;
    location?: object;
    tags: Array<string>;
    details?: object;

    /**
     * @param name The name of the resource
     * @param location An object containing the geopoint (coordinates) and address of a resource
     * @param tags A list of the resources 'tags' used to descrive the goods and/or services this resource offers
     */
    constructor( name: string, tags: Array<string>, location?: object )
    {
        this.name = name;
        this.tags = tags;

        if( !location || location.hasOwnProperty("geopoint") || location.hasOwnProperty("address") )
        {
            this.location = location;
        }
        else
        {
            if( location != undefined )
            {
                // Something has gone wrong. TODO: Handle this error
            }
        }
    }

    /**
     *  Retrieves details about this resource from the database
     *  Must be called before any info paragraph, contact info, operating hours, and any other details are accessed
     */
    public retrieveDetails() {
        if( this.details !== undefined )
        {
            // TODO: Perhaps this should invoke a warning?
            return;
        }
        const db = Database.getInstance();
    }
}


type ResourceList = {
    [documentID: string]: Resource;
} | undefined;

let __resourceCache: ResourceList = undefined;

/**
 * Gets all the resources in the database without loading their details
 * Will download and cache the resources.
 * @returns A promise to a resource list
 */
export function getAllResources(): Promise<ResourceList> {
    if( __resourceCache === undefined )
    {
        __resourceCache = {};
        return Database.getInstance().collection("resource").get().then( (snapshot: firebase.firestore.QuerySnapshot) => {
            snapshot.forEach( (document: firebase.firestore.QueryDocumentSnapshot) => {
                // This undefined check should not be necessary, however typescript cannot see that resourceCache is not undefined
                if( __resourceCache )
                    __resourceCache[ document.id ] = new Resource( document.data().name, [] );
            });
            return __resourceCache;
        });
    }
    else
        return new Promise( (resolve) => resolve(__resourceCache) );
}


/**
 *  Clears the resource cache. Calling getAllResources after this will ensure that fresh data is downloaded
 */
export function clearResourceCache() {
    __resourceCache = undefined;
}