import { Database } from '../database/instance';
import LatLon from 'geodesy'
import algoliasearch from 'algoliasearch'
import { resolve } from 'dns';

// Search API by Algolia
const algoliaClient = algoliasearch("ZNAVVMB14R", "fb6bae007584585719e79b195fc57ab2");
const algoliaResourceIndex = algoliaClient.initIndex("name");

// Types
type ResourceList = {
    [documentID: string]: Resource;
} | undefined;

// Type to represent queries done on resource lists
type ResourceQuery = {
    text?: string;
    area?: AreaSpecifier;
    tags?: [string];
}

// Classes

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
    public details(): Promise<object> {
        if( this.__details !== undefined )
        {
            return new Promise( (resolve) => { resolve(this.__details) } );
        }
        if( this.detailsRef === undefined )
            return new Promise( (resolve) => { resolve(undefined) } );

        return this.detailsRef.get().then( (detailsSnapshot: firebase.firestore.DocumentSnapshot) => {
            return new Promise( (resolve, reject) => {
                if( detailsSnapshot == undefined )
                {
                    reject("Could not retrieve details document.");
                }
                else
                {
                    this.__details = detailsSnapshot.data();
                    resolve(this.__details);
                }
            });
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

    public isWithin( areaSpecifier: AreaSpecifier ): boolean {
        if( !location || !location.hasOwnProperty("latitude") || !location.hasOwnProperty("longitude")  )
        {
            throw "Resource is missing lat/lon!";
        }

        let areaCenterPoint = new LatLon.LatLonSpherical(areaSpecifier.latitude, areaSpecifier.longitude);
        // I should probably have a type for location info.
        // @ts-ignore
        let resourceLocation = new LatLon.LatLonSpherical(location["latitude"], location["longitude"]);
        return areaSpecifier.distance <= areaCenterPoint.distanceTo( resourceLocation );
    }
}

// Methods
/**
 * Get resources by any or none of the following: text search, area limiting, and tag filtering.
 * 
 * Searching by Tags: Tags are sensitive at the moment. Meaning that tag strings must exactly match
 * the database, else the get method will not retireve them.
 * Searching by Text: Will search all listing information of a resource. Including name, location, and tags.
 * Searching by Location: Will filter results using an AreaSpecifier. I.e. a location and a maximum distance
 * @param query optional argument. If provided, should follow the type specified by ResourceQuery.
 */
export function get( query: ResourceQuery ): Promise<ResourceList> {
    if( query == undefined )
    {
        query = {};
    }
    // Get resources by any combonation or none of the following
    // Get resources by text
    // Get resources by locaton
    // Get resources by tags
    
    // If we wish to do a text search, this must be done through algolia
    if( query.text != undefined )
    {
        return algoliaResourceIndex.search(query.text).then( (content) => {
            let list: ResourceList = {};
            content.hits.forEach( (hit) => {
                let detailsRef = Database.getInstance().doc(hit["details-reference"]._path.segments.join('/'));
                let resource = new Resource(hit["name"], hit["tags"], hit["location"], detailsRef );
                // Apply other filters as specified by the query
                if( query.tags != undefined )
                {
                    if( !query.tags.every( queryTag => resource.tags.includes(queryTag) ) )
                        return; // "continue"
                }

                if( query.area != undefined )
                {
                    if( !resource.isWithin( query.area ) )
                        return; // "continue"
                }

                // The typescript compiler cant see that 'list'
                // is guaranteed to be defined.
                // @ts-ignore
                list[hit.objectID] = resource;
            });
            return list;
        });
    }
    else if( query.area != undefined )
    {
        let areaCenterPoint = new LatLon.LatLonSpherical(query.area.latitude, query.area.longitude);
        let northmostLatitude = areaCenterPoint.destinationPoint(query.area.distance, 0).lat;
        let southmostLatitude = areaCenterPoint.destinationPoint(query.area.distance, 180).lat;
        let eastmostLongitude = areaCenterPoint.destinationPoint(query.area.distance, 90).lon;
        let westmostLongitude = areaCenterPoint.destinationPoint(query.area.distance, 270).lon;

        // First get documents within the latitude range.
        return Database.getInstance().collection("resource")
            .where("location.latitude", ">=", southmostLatitude)
            .where("location.latitude", "<=", northmostLatitude)
            .get().then( (snapshot: firebase.firestore.QuerySnapshot) => {
                let list: ResourceList = {};
                snapshot.forEach( (document: firebase.firestore.QueryDocumentSnapshot) => {
                    let documentData = document.data();
                    // Only cache the documents that are within the longitude range.
                    // I.e. discard those that are not.
                    if( documentData["location"]["longitude"] >= westmostLongitude
                    &&  documentData["location"]["longitude"] <= eastmostLongitude )
                    {
                        // This undefined check should not be necessary, however typescript cannot see that resourceCache is defined
                        if( list )
                        {
                            let resource = new Resource( documentData["name"], documentData["tags"], documentData["location"], documentData["details-reference"]);
                            // Typescript cant see that I just assigned list[document.id]. ugh.
                            // @ts-ignore
                            if( query.tags && !query.tags.every( tag => list[document.id].tags.includes(tag) ) )
                            {
                                return; // "continue"
                            }
                            list[document.id] = resource;
                            // Determine the distance from center point of the area specifier to the resource
                            let resourceLatLon = new LatLon.LatLonSpherical( documentData["location"]["latitude"], documentData["location"]["longitude"] );
                            let distance = areaCenterPoint.distanceTo( resourceLatLon );
                            if(list[document.id].location)
                                Object.assign(list[document.id].location, {"distance": distance});
                        }
                    }
                });
                return list;
            });
    } 
    else
    {
        return Database.getInstance().collection("resource").get().then( (snapshot: firebase.firestore.QuerySnapshot) => {
            let list: ResourceList = {};
            snapshot.forEach( (document: firebase.firestore.QueryDocumentSnapshot) => {
                // This undefined check should not be necessary, however typescript cannot see that resourceCache is defined
                if( list )
                {
                    let documentData = document.data();
                    let resource = new Resource( documentData["name"], documentData["tags"], documentData["location"], documentData["details-reference"] );
                    if( query.tags && !query.tags.every( tag => resource.tags.includes(tag) ) )
                    {
                        return; // "continue"
                    }
                    list[document.id] = resource;
                }
            });
            return list;
        });
    }
}

// The front end should only need the "get" method. The following are for more extensive operations.

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
 * Requires authentication. See the Auth module.
 * @param resource the resource object to upload. 
 * @param documentID the ID of the document in the firebase "resource" collection
 */
export function submitResource( resource: Resource ): Promise<void>
{  
    let documentID: string;
    return resource.details().then( (details) => {
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

/** 
 * Delete a resource and it's details listing from the backend by its ID
 * Requires authentication. See the Auth module.
 * @param id the resource's ID
 */
export function deleteResourceByID( id: string ): Promise<void>{
    let documentRef = Database.getInstance().collection("resource").doc(id);
    return documentRef.get().then( (snap: firebase.firestore.DocumentSnapshot) => {
        // Delete the details reference
        if( !snap )
        {
            return new Promise<void>((resolve, reject) => {
                reject("Specified resource does not exist.");
            });
        }
        let detailsRef = snap.get("details-reference") as firebase.firestore.DocumentReference;
        return detailsRef.delete();
    }).then( () => {
        // Delete the original document
        return documentRef.delete();
    });
}