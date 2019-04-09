import { Database } from '../database/instance';
import LatLon from 'geodesy'

export class Resource
{
    name: string;
    location?: object;
    tags: Array<string>;
    private __details?: firebase.firestore.DocumentData;
    private __detailsRef: firebase.firestore.DocumentReference;

    /**
     * @param name The name of the resource
     * @param location An object containing the geopoint (coordinates) and address of a resource.
     *                 Some methods will augment a resources location attribute, adding a distance parameter.
     * @param tags A list of the resources 'tags' used to descrive the goods and/or services this resource offers
     */
    constructor( name: string, tags: Array<string>, detailsRef: firebase.firestore.DocumentReference, location?: object )
    {
        this.name = name;
        this.tags = tags;
        this.__detailsRef = detailsRef;

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
     *  Retrieves details about this resource.
     *  Returns an object with info paragraph, contact info, operating hours, and any other details.
     */
    public details(): Promise<firebase.firestore.DocumentData | undefined> {
        if( this.__details !== undefined )
        {
            return new Promise( (resolve) => { resolve(this.__details) } );
        }
        return this.__detailsRef.get().then( (detailsSnapshot: firebase.firestore.DocumentSnapshot) => {
            this.__details = detailsSnapshot.data();
            if( this.__details === undefined || this.__details.exists === false )
            {
                throw new Error("Details reference was invalid");
            }
            return this.__details;
        });
    }

    /**
     *  Deletes the details contained in this resource. Ensures that retrieveDetails gets fresh data.
     */
    public clearDetailsCache() {
        this.__details = undefined;
    }
}


type ResourceList = {
    [documentID: string]: Resource;
} | undefined;

let __resourceCache: ResourceList = undefined;

// Type to define an area to search within
export class AreaSpecifier {
    latitude: number;
    longitude: number;
    distance: number;
    /**
     * @param latitude the horizontal center line of the area
     * @param longitude the vertical cetner line of the area
     * @param distance A maximum distance from the point implied by latitude and longitude in METERS. 
     *                 Not Metres you colonizers! 
     */
    constructor( latitude: number, longitude: number, distance: number )
    {
        this.latitude = latitude;
        this.longitude = longitude;
        this.distance = distance;
    }

    static fromGeopoint( location: firebase.firestore.GeoPoint, distance: number )
    {
        return new this( location.latitude, location.longitude, distance );
    }
}

/**
 * Gets all the resources in the database without loading their details
 * Will download and cache the resources.
 * @param areaSpecifier A specifier for the location in which to find resources. If specified, each resource will have a distance property assigned to it's location object.
 * Note: The cache of resources will be specific to the areaSpecifier (or lackthereof)
 * If you wish to retrieve resources for a new area, the cache must be cleared with @function clearResourceCache
 * @returns A promise to a resource list
 */
export function getAllResources( areaSpecifier?: AreaSpecifier ): Promise<ResourceList> {
    if( __resourceCache === undefined )
    {
        __resourceCache = {};
        if( areaSpecifier !== undefined )
        {
            // Unfortunatly, Firestore does not nativly support querying by geopoints.
            // Anything built on top if it to do so is a hack. Like so:
            let areaCenterPoint = new LatLon.LatLonSpherical(areaSpecifier.latitude, areaSpecifier.longitude);
            let northmostLatitude = areaCenterPoint.destinationPoint(areaSpecifier.distance, 0).lat;
            let southmostLatitude = areaCenterPoint.destinationPoint(areaSpecifier.distance, 180).lat;
            let eastmostLongitude = areaCenterPoint.destinationPoint(areaSpecifier.distance, 90).lon;
            let westmostLongitude = areaCenterPoint.destinationPoint(areaSpecifier.distance, 270).lon;

            // First get documents within the latitude range.
            return Database.getInstance().collection("resource")
                .where("location.latitude", ">=", southmostLatitude)
                .where("location.latitude", "<=", northmostLatitude)
                .get().then( (snapshot: firebase.firestore.QuerySnapshot) => {
                    snapshot.forEach( (document: firebase.firestore.QueryDocumentSnapshot) => {
                        let documentData = document.data();
                        // Only cache the documents that are within the longitude range.
                        // I.e. discard those that are not.
                        if( documentData["location"]["longitude"] >= westmostLongitude
                        &&  documentData["location"]["longitude"] <= eastmostLongitude )
                        {
                            // This undefined check should not be necessary, however typescript cannot see that resourceCache is defined
                            if( __resourceCache )
                            {
                                __resourceCache[document.id] = new Resource( documentData["name"], documentData["tags"], documentData["details-reference"], documentData["location"]);
                                // Determine the distance from center point of the area specifier to the resource
                                let resourceLatLon = new LatLon.LatLonSpherical( documentData["location"]["latitude"], documentData["location"]["longitude"] );
                                let distance = areaCenterPoint.distanceTo( resourceLatLon );
                                if(__resourceCache[document.id].location)
                                    Object.assign(__resourceCache[document.id].location, {"distance": distance});
                            }
                        }
                    });
                    return __resourceCache;
                });
        }
        else
        {
            return Database.getInstance().collection("resource").get().then( (snapshot: firebase.firestore.QuerySnapshot) => {
                snapshot.forEach( (document: firebase.firestore.QueryDocumentSnapshot) => {
                    // This undefined check should not be necessary, however typescript cannot see that resourceCache is defined
                    if( __resourceCache )
                    {
                        let documentData = document.data();
                        __resourceCache[ document.id ] = new Resource( documentData["name"], [], documentData["details-reference"], documentData["location"] );
                    }
                });
                return __resourceCache;
            });
        }
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

/**
 * Retrieves a resource by its document id in firestore.
 * @param id The ID of the resource in the "resource" collection
 * @returns A promise which will resolve to the resource. If a document with that ID does not exist, the promise will be rejected.
 */
export function getResourceByID( id: string ) : Promise<Resource>
{
    return Database.getInstance().collection("resource").doc(id)
           .get().then( (doc: firebase.firestore.DocumentSnapshot) => {
            return new Promise<Resource>((resolve, reject) => { 
                let documentData = doc.data();
                if( documentData === undefined )
                {
                    reject();
                }
                else
                {
                    resolve( new Resource( documentData["name"], [], documentData["details-reference"], documentData["location"] ) );
                }
            });
        });
}