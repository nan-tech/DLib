import { Database } from '../database/instance';
import LatLon from 'geodesy'

export class Resource
{
    name: string;
    tags: Array<string>;
    location?: object;
    detailsRef?: firebase.firestore.DocumentReference;
    private __details?: object;

    public searilize(): object {
        let searilization = {};
        Object.assign( searilization, {
            "name" : this.name,
            "tags" : this.tags
        });
        if( location !== undefined )
        {
            Object.assign(searilization, {
                "location" : this.location
            })
        }
        return searilization;
    }

    /**
     * @param name The name of the resource
     * @param location An object containing the geopoint (coordinates) and address of a resource.
     *                 Some methods will augment a resources location attribute, adding a distance parameter.
     * @param tags A list of the resources 'tags' used to descrive the goods and/or services this resource offers
     */
    constructor( name: string, tags: Array<string>, location: object, detailsRef?: firebase.firestore.DocumentReference )
    {
        this.name = name;
        this.tags = tags;
        this.detailsRef = detailsRef;

        if( !location || location.hasOwnProperty("geopoint") || location.hasOwnProperty("address") )
        {
            this.location = location;
        }
        else
        {
            if( location != undefined )
            {
                throw new Error("Cannot create a resource with an invalid location. Location object lacks either a geopoint or address property");
            }
        }
    }

    /**
     *  Retrieves details about this resource.
     *  Returns an object with info paragraph, contact info, operating hours, and any other details.
     */
    public details(): Promise<object | undefined> {
        if( this.__details !== undefined )
        {
            return new Promise( (resolve) => { resolve(this.__details) } );
        }
        if( this.detailsRef === undefined )
            return new Promise( (resolve) => { resolve(undefined) } );

        return this.detailsRef.get().then( (detailsSnapshot: firebase.firestore.DocumentSnapshot) => {
            this.__details = detailsSnapshot.data();
            return this.__details;
        });
    }

    /**
     *  Deletes the details contained in this resource. Ensures that retrieveDetails gets fresh data.
     */
    public clearDetailsCache() {
        this.__details = undefined;
    }

    /**
     * Set the details object of this resource. Used for creating new resources
     * @param details The resource details object
     */
    public setDetails( details: object )
    {
        // If the details argument lacks a listing-reference property, but the internal object has one, take the internal objects reference
        if( this.__details != undefined && this.__details.hasOwnProperty("listing-reference") && !details.hasOwnProperty("listing-reference") )
        {
            Object.assign(details, {
                // @ts-ignore
                "listing-reference": this.__details["listing-reference"]
            })
        }
        this.__details = details;
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
                                __resourceCache[document.id] = new Resource( documentData["name"], documentData["tags"], documentData["location"], documentData["details-reference"]);
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
                        __resourceCache[ document.id ] = new Resource( documentData["name"], documentData["tags"], documentData["location"], documentData["details-reference"] );
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
                    resolve( new Resource( documentData["name"], [], documentData["location"], documentData["details-reference"] ) );
                }
            });
        });
}

/**
 * Uploads a resource to the database. If the resource already exists, it is overwritten.
 * @param resource the resource object to upload. 
 * @param documentID the ID of the document in the firebase "resource" collection
 */
export function submitResource( resource: Resource, documentID?: string ): Promise<void>
{  
    return resource.details().then( (details) => {
        if( documentID === undefined )
        {
            if( details !== undefined && details.hasOwnProperty("listing-reference") )
            {
                // Typescript won't let me do what I want here. Not a lot of patience with the type checker today
                // @ts-ignore
                documentID = details["listing-reference"].id;
            }
            else
            {
                documentID = Database.getInstance().collection("resource").doc().id;
            }
        }
        // Upload details document
        // Make the details document point to the listing document
        if( details === undefined )
        {
            details = {};
        }

        Object.assign(details, { 
            "listing-reference" : Database.getInstance().collection("resource").doc(documentID)
        });

        resource.setDetails( details );

        // To appease type checker
        let detailsRef: firebase.firestore.DocumentReference;
        if( resource.detailsRef === undefined )
        {
            detailsRef = Database.getInstance().collection("resource-details").doc();
            resource.detailsRef = detailsRef;
        }
        else
        {
            detailsRef = resource.detailsRef;
        }

        return resource.detailsRef.set(details).then( () => {
            return detailsRef;
        });
    }).then( (documentReference : firebase.firestore.DocumentReference) => {
        // Upload listing document
        let searilization = resource.searilize();
        Object.assign( searilization, {
            "details-reference": documentReference
        });
        return Database.getInstance().collection("resource").doc(documentID).set( searilization );
    });
}