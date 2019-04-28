# API Documentation

The Javascript file built from this library exposes the name DLib into the window namespace.

The library provides three public modules:
* Database ( DLib.Database )
* Auth     ( DLib.Authenticate() )
* Resource ( Dlib.Resource )

## Database Module

The database module is used primarily by other modules in the library. However, it is publicly visible.
This module manages the connection handle to the firestore database. It exposes one function.

Function: `DLib.Database.getInstance()`
Returns a shared instance of the firebase database object. Will be active and ready for queries.

## Auth Module

The Auth module handles authentication for privilieged operations. 
Authentication is not required unless a user needs to create, modify, or delete resources.
The Auth module exposes one function as the module.

Function: `DLib.Authenticate()`
Authenticates a user using a google login. Will create a popup and return the user to the page when complete.
There is a whitelist of users allowed to perform privileged operations. Currently, users must be added manually from the firebase console.

## Resource Module

The resource module specifies what a resource is and what you can do with resources.

It defines two classes.

### Class: `DLib.AreaSpecifier`
This data type is used to query resources within a physical area.

#### Data members
`DLib.AreaSpecifier.latitude: number` The latitude of the centroid
`DLib.AreaSpecifier.longitude: number` The longitude of the centroid
`DLib.AreaSpecifier.distance: number` Defines the size of the rectangular bound used to filter resources.
#### Functions
`new DLib.AreaSpecifier( latitude: number, longitude: number, distance: number )`
Constructs a new area centered about the point defined by latitude and longitude and rectangularly bounded by distance.
Disance is the maximum allowed distance in meters.

`static DLib.AreaSpecifier.fromGeopoint( location: firebase.firestore.GeoPoint, distance: number )`
Constructs an area specifier using a firestore GeoPoint object as opposed to a lat/lon.

### Class: `Resource`
This class represents a resource and all its associated fields.

#### Data members
`DLib.Resources.Resource.name: string` The name of the resource
`DLib.Resources.Resource.tags: Array<string>` The tags associated with this resource
`DLib.Resources.Resource.location?: object` The location object. Can take the following form:
```
location = { 
    latitude: 124.2415,
    longitude: -234.5214,
    address: "434 Dairy Rd.",
    city: "Davis",
    state_code: "CA",
    zip_code: "95616"
}
```
`DLib.Resources.Resource.detailsRef?: firebase.firestore.DocumentReference` A reference to a document which contains further information about this resource. 
Note: accessing the document via this reference is not recomended. See instead `DLib.# API Documentation

The Javascript file built from this library exposes the name DLib into the window namespace.

The library provides three public modules:
* Database ( DLib.Database )
* Auth     ( DLib.Authenticate() )
* Resource ( Dlib.Resource )

## Database Module

The database module is used primarily by other modules in the library. However, it is publicly visible.
This module manages the connection handle to the firestore database. It exposes one function.

Function: `DLib.Database.getInstance()`
Returns a shared instance of the firebase database object. Will be active and ready for queries.

## Auth Module

The Auth module handles authentication for privilieged operations. 
Authentication is not required unless a user needs to create, modify, or delete resources.
The Auth module exposes one function as the module.

Function: `DLib.Authenticate()`
Authenticates a user using a google login. Will create a popup and return the user to the page when complete.
There is a whitelist of users allowed to perform privileged operations. Currently, users must be added manually from the firebase console.

## Resource Module

The resource module specifies what a resource is and what you can do with resources.

It defines two classes.

### Class: `DLib.AreaSpecifier`
This data type is used to query resources within a physical area.

#### Data members
`DLib.AreaSpecifier.latitude: number` The latitude of the centroid
`DLib.AreaSpecifier.longitude: number` The longitude of the centroid
`DLib.AreaSpecifier.distance: number` Defines the size of the rectangular bound used to filter resources.
#### Functions
`new DLib.AreaSpecifier( latitude: number, longitude: number, distance: number )`
Constructs a new area centered about the point defined by latitude and longitude and rectangularly bounded by distance.
Disance is the maximum allowed distance in meters.

`static DLib.AreaSpecifier.fromGeopoint( location: firebase.firestore.GeoPoint, distance: number )`
Constructs an area specifier using a firestore GeoPoint object as opposed to a lat/lon.

### Class: `Resource`
This class represents a resource and all its associated fields.

#### Data members
`DLib.Resource.Resource.name: string` The name of the resource
`DLib.Resource.Resource.tags: Array<string>` The tags associated with this resource
`DLib.Resource.Resource.location?: object` The location object. Can take the following form:
```
location = { 
    latitude: 124.2415,
    longitude: -234.5214,
    address: "434 Dairy Rd.",
    city: "Davis",
    state_code: "CA",
    zip_code: "95616"
}
```
`DLib.Resource.Resource.detailsRef?: firebase.firestore.DocumentReference` A reference to a document which contains further information about this resource. 
Note: accessing the document via this reference is not recomended. See instead `DLib.# API Documentation

The Javascript file built from this library exposes the name DLib into the window namespace.

The library provides three public modules:
* Database ( DLib.Database )
* Auth     ( DLib.Authenticate() )
* Resource ( Dlib.Resource )

## Database Module

The database module is used primarily by other modules in the library. However, it is publicly visible.
This module manages the connection handle to the firestore database. It exposes one function.

Function: `DLib.Database.getInstance()`
Returns a shared instance of the firebase database object. Will be active and ready for queries.

## Auth Module

The Auth module handles authentication for privilieged operations. 
Authentication is not required unless a user needs to create, modify, or delete resources.
The Auth module exposes one function as the module.

Function: `DLib.Authenticate()`
Authenticates a user using a google login. Will create a popup and return the user to the page when complete.
There is a whitelist of users allowed to perform privileged operations. Currently, users must be added manually from the firebase console.

## Resource Module

The resource module specifies what a resource is and what you can do with resources.

It defines two classes.

### Class: `DLib.AreaSpecifier`
This data type is used to query resources within a physical area.

#### Data members
`DLib.AreaSpecifier.latitude: number` The latitude of the centroid
`DLib.AreaSpecifier.longitude: number` The longitude of the centroid
`DLib.AreaSpecifier.distance: number` Defines the size of the rectangular bound used to filter resources.
#### Functions
`new DLib.AreaSpecifier( latitude: number, longitude: number, distance: number )`
Constructs a new area centered about the point defined by latitude and longitude and rectangularly bounded by distance.
Disance is the maximum allowed distance in meters.

`static DLib.AreaSpecifier.fromGeopoint( location: firebase.firestore.GeoPoint, distance: number )`
Constructs an area specifier using a firestore GeoPoint object as opposed to a lat/lon.

### Class: `DLib.Resources.Resource`
This class represents a resource and all its associated fields.

#### Data members
`DLib.Resources.Resource.name: string` The name of the resource
`DLib.Resources.Resource.tags: Array<string>` The tags associated with this resource
`DLib.Resources.Resource.location?: object` The location object. Can take the following form:
```
location = { 
    latitude: 124.2415,
    longitude: -234.5214,
    address: "434 Dairy Rd.",
    city: "Davis",
    state_code: "CA",
    zip_code: "95616"
}
```
`DLib.Resources.Resource.detailsRef?: firebase.firestore.DocumentReference` A reference to a document which contains further information about this resource. 
Note: accessing the document via this reference is not recomended. See instead `DLib.Resources.details()`

### Functions
`new DLib.Resources.Resource( name: string, tags: Array<string>, location: object, detailsRef?: firebase.firestore.DocumentReference )`
Construct a new resource with the specified information. The doucment reference field should be left blank when manually constructing a new resource. 
If you are trying to retireve an existing resource, see the other functions defined in this module.

`DLib.Resources.Resource.searilize(): object` Converts a resource into a JSON object. Used internally in the resource submission process.

`DLib.Resources.Resource.details(): Promise<object>` Retrieves the details of a resource in promise form.
Code example:
```
resource.details().then( (detailsObject) => {
    console.log("We have the details of the resource.");
}).catch( () => {
    console.log("We couldnt get the details of the resource.");
});
```
The details object is retrieved from the database and cashed in the resource object. Following calls to details() will not retrieve data from the database.

`DLib.Resources.Resource.clearDetailsCache()`
Clears the details object cashed in the resource object.

`DLib.Resources.setDetails( details: object )`
Set the details object of a resource. When constructing a new resource to upload, this function should be used to assign the details of a resource.

`DLib.Resources.isWithin( areaSpecifier: AreaSpecifier ): boolean`
Returns true if the resource is within the specified area. Will throw an error if the resource does not contain the required location information.





