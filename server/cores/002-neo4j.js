import winston from "winston";
const neo4j = require("neo4j-driver").v1;

module.exports = async (app) => {
    app.db = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "neo4j"));
    app.dbSession = app.db.session();

    app.cypher = async (q, p) => {
        try {
            return await app.dbSession.run(q, p);
        } catch (e) {
            console.log("Query failed:");
            console.dir(q);
            console.dir(p);
            throw e;
        }
    };
    app.mapCypher = (c, r) => {
        const rs = c.records;
        let rows = [];
        for(let i=0;i<rs.length;++i){
            var row = {};
            for(var v of r){
                row[v] = rs[i].get(v).properties;
            }
            rows.push(row);
        }
        return rows;
    }
    winston.info("Neo4j driver loaded!");
};
