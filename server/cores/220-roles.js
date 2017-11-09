

module.exports = async (app) => {
    var api = {};

    await app.cypher('CREATE CONSTRAINT ON (r:Role) ASSERT r.type IS UNIQUE');
    await app.cypher('CREATE CONSTRAINT ON (r:Achievement) ASSERT r.type IS UNIQUE');

    api.create_achievement = async (name, req, value) => {
        var role = await app.cypher('MATCH (r:Achievement {type:{name}}) RETURN r', {name});
        if(role.records.length==0){
            await app.cypher('CREATE (r:Achievement {type:{name}, req:{req}, value:{value}})', {name, req, value});
        }
    }

    api.addAchievement = async (user, achievement, points) => {
        if(!points) points = 1;
        var er = await app.cypher(  'MATCH (u:User {id:{user}}), (r:Achievement {type:{achievement}}) ' + 
                                    'MERGE (u)-[e:ACHIEVEMENT_PROGRESS]->(r) '+
                                    'ON MATCH SET   e.achieved = (e.points + {points} > r.req) , e.points = e.points + {points} '+
                                    'ON CREATE SET  e.achieved = ({points} > r.req) , e.points = {points}'
                         , {user, achievement, points});
    }
    api.addRole = async (user, role, xp) => {
        await app.cypher(   'MATCH (u:User {id:{user}}), (r:Role {type:{type}}) ' + 
                            'MERGE (u)-[e:HAS_ROLE]->(r) '+
                            'ON MATCH SET   e.level = (e.xp + {xp} + 1000)/1000 , e.xp = e.xp + {xp} '+
                            'ON CREATE SET  e.level = (1000+{xp})/1000          , e.xp = {xp}'
                         , {user, role, xp});
    }

    api.getBestRole = async (user) => {
        var v = await app.cypher('MATCH (u:User {id:{user}})-[e:HAS_ROLE]->(r:Role) WHERE EXISTS(e.xp)  RETURN r,e ORDER BY e.xp DESC LIMIT 1', {user});

        if(v.records.length == 0) return {role:'anonymous', level:1, xp:0};

        var r = v.records[0].get('r').properties;
        var e = v.records[0].get('e').properties;

        return {
            role:r.type,
            xp:e.xp?e.xp.toNumber():0,
            level:e.level?e.level.toNumber():1,
        }
    }
	
    require('../tools/core').loader("achievements", app);
    app.roleApi = api;
}
