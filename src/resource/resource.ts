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
    constructor( name: string, location: object, tags: Array<string> )
    {
        this.name = name;
        this.tags = tags;

        if( location.hasOwnProperty("geopoint") || location.hasOwnProperty("address") )
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
