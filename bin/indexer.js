/* global process, console */

if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}


/* requirements */

var fs = require('fs'),
    si = require('search-index'),
    mongo = require('mongodb');


function arrow(msg){
    console.log("-----> " + msg);
}

function indent(msg){
    console.log("       " + msg);
}


function getConfiguration(cb){

    arrow("Parsing forage configuration");
    fs.readFile(
        process.argv[2],
        'utf8',
        function(err, data) {
            if(err){
                console.dir(err);
                process.exit(1);
            }
            var config = JSON.parse(data);
            cb(config);
        }
    );

}


function getDBConnection(conn, cb){

    arrow("Connecting to db (" + conn + ")");
    mongo.MongoClient.connect(
        conn,
        function(err, db){
            if(err){
                console.dir(err);
                process.exit(1);
            }
            cb(db);
        }
    );

}


function mapCollection(db, idx, config, cb){

    var subconf = config.collections[idx];

    db.collection(
        subconf.meta.collection_name,
        function(err, collection){

            if(err){
                return console.dir(err);
            }

            var indexBatch = {}; 
                
            var stream = collection.find().stream();
            stream.on('data', function(item){

                var doc = {}; 

                for(var field in subconf.mapping){

                    var smp = subconf.mapping[field];

                    if(typeof smp == "string"){
                        doc[field] = item[smp];
                    } else {

                        if(smp.hasOwnProperty('type')){

                            switch(smp.type){
                                case "nested":
                                    var value = [];
                                    for(var child in item[smp.parent]){
                                        value.push(item[smp.parent][child][smp.field]);
                                    }
                                    doc[field] = value;
                                    break;
                            }

                        }

                    }

                }

                var doc_id = item[subconf.meta.id_field];
                indexBatch[doc_id] = doc;

            });

            stream.on('end', function(){

                si.index(
                    JSON.stringify(indexBatch),
                    subconf.meta.collection_name + "_preindex",
                    subconf.meta.filter_fields,
                    function(){

                        if(idx == config.collections.length - 1){
                            cb();
                        } else {
                            mapCollection(db, idx+1, config, cb);
                        }

                    }
                );

            });
        }
    );

}


getConfiguration(function(config){

    getDBConnection(config.db_config, function(db){

        arrow("Iterating collections");
        mapCollection(db, 0, config, function(){
            arrow("Complete!");
            process.exit(1);
        });

    });

});
