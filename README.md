Heroku Buildpack for Node.js (with auto-indexing Forage on build)
============================

This is a fork of the official [Heroku buildpack](http://devcenter.heroku.com/articles/buildpacks) for Node.js apps.

What does it do?
----------------

This buildpack is designed to index a mongo datasource, via a prescribed mapping, for use with a forage instance. This is probably not a great idea, but suits my needs right now.

How do I use it?
----------------

First, ensure your project is already using forage (or search-index straight), else this buildpack is wasted effort for you. Then create a configuration file called "forage.json" in the root of your application. This file must be a JSON formatted file with a very specific structure, an example and explanation of which is below.

    {

        // a fully qualified mongo db config line
        "db_config": "mongodb://user:pass@host:port/database",

        // an array of model -> document mappings
        "collections": [

                // each mapping object has two children, "meta" and "mapping"
                {
                
                    // the meta object contains structural info
                    "meta": {

                        // the collection in the mongo db to be mapped and indexed
                        "collection_name": "myModel",

                        // the field on the colletion to use as the unique document id when indexed
                        "id_field": "_id",

                        // fields to filter on when searched
                        "field_fields": ["category", "tag"]

                    },

                    // the mapping object describes each field to be included in the index
                    "mapping" :{

                        // fields with simple data can map directly
                        // the key is the name on the indexed document
                        // the value is the name on the mongo model
                        "title": "title",

                        // these don't have to be the same
                        "summary": "description",

                        // nested models can be handled on a per field basis
                        "author_name": {

                            // tell the indexer this is a nested model
                            "type": "nested",

                            // the name of the submodel on the model
                            "parent": "author",

                            // the field of the submodel we want to index
                            "field": "name"

                        }

                        // this can be repeated for each subfield
                        "author_gender": {

                            "type": "nested",
                            "parent": "author",
                            "field": "gender"

                        }
                    }


                }

        ]

    }

Further Information
-------------------

Please see the [original repo](https://github.com/heroku/heroku-buildpack-nodejs) for information on this buildpack. Any special cases or scenarios not outlined in this README should be covered there.
