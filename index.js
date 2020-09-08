const math = require('mathjs');
const csvtojson = require('csvtojson');
const mysql = require('mysql');

const Discord = require("discord.js");
const config = require("./config.json");
const bot = new Discord.Client();


const prefix = "!";

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '!2345Sheepy',
    database: 'test1'
  });
  
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

bot.on("ready", function() {
    console.log("RiskBot online");
});
bot.on("message", function(message) {
    if (message.author.bot) 
        return;
    if (!message.content.startsWith(prefix)) 
        return;
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    for (let i = 0; i < args.length ; i ++){
        args[i].toLowerCase();
    }
    if(args[0] === "stack")
        searchItem(args,message);
    if(args[0] === "help")
        displayAllItems(args,message);
});

async function displayAllItems(command,message){
    console.log (command);
    var string_start = "```";
    var uncommon_color ='css';
    var legendary_color = 'diff';
    var lunar_color = 'ini';
    var string_end = "```";

    var common_string = string_start;
    var uncommon_string = string_start + uncommon_color + "\n" ;
    var legendary_string = string_start + legendary_color + "\n";
    var lunar_string = string_start + lunar_color + "\n";
    
    let items = await retrieveAllItems();
    var i = 0;
    for(i; i < items.length && items[i].rarity === "common"; i ++){
        common_string += items[i].name + " : " + items[i].search_key +"\n";
    }
    common_string += string_end;

    for(i; i < items.length && items[i].rarity === "uncommon"; i ++){
        uncommon_string += items[i].name + " : " + items[i].search_key +"\n";
    }
    uncommon_string += string_end;
    /*
    for(i; i < items.length && items[i].rarity === "legendary"; i ++){
        legendary_string += items[i].name + " : " + items[i].search_key +"\n";
    }
    legendary_string += string_end;

    for(i; i < items.length && items[i].rarity === "lunar"; i ++){
        lunar_string += items[i].name + " : " + items[i].search_key +"\n";
    }
    lunar_string += string_end;
    */
    
    message.channel.send("Use '!stack [search key] [number]' for stacking information." );
    message.channel.send("Item Name : Search Key")
    message.channel.send(common_string);
    message.channel.send(uncommon_string)

}

async function retrieveAllItems(){
    let selectAll = "SELECT rarity,name,search_key FROM items";
    let res = {};
    connection.query(selectAll, function (err, result) {
        if (err) throw err;
        res = result;
    });
    await sleep(2000);
    return res;
}



async function searchItem(command, message){
    console.log(command);
    let item = {
        name: "",
        description: "",
        rarity: "",
        number:""
    };
    if(command[0] === "stack"){
        try{
            if(command[4] != null){ 
                item = await checkItem(command[1] + " " + command[2] + " " + command[3], command[4]);
            }
           
           else if (command[3] != null){
                item = await checkItem(command[1] + " " + command[2], command[3]);
           }
           else{
            item = await checkItem(command[1],command[2]);
            }
        }
        catch(e){
            bot.login(config.BOT_TOKEN);
        }
    }
    if (item.name != ""){
        const exampleEmbed = new Discord.MessageEmbed()
        .setTitle(item.name)
        .addFields(
            { name: 'Rarity', value: item.rarity },
            { name: 'Number', value: item.number },
            { name: 'Description', value: item.description}
        );
        
        if(item.rarity === "common")
            exampleEmbed.setColor('#000000');
        if(item.rarity === "uncommon")
            exampleEmbed.setColor('#4cff33');
        if(item.rarity === "legendary")
            exampleEmbed.setColor('#ff3333');
        if(item.rarity === "lunar")
            exampleEmbed.setColor('#0000ff');

        message.channel.send(exampleEmbed);
    }
    else
        message.channel.send(item.description);

}

async function checkItem(item_name,stack){
    var str = "'" + item_name + "'";
    var select = "SELECT * FROM items WHERE search_key =" + str ;
    var item = {
        name: "",
        description: "Error, check spelling or syntax.",
        rarity: "",
        number:""
    };

    connection.query(select, function (err, result) {
        if (err) throw err;
        try{
            console.log(result);
        
            var scope = {
                n:stack
            };
            var form = math.compile(String(result[0].formula));
            var first_calc = Math.round(form.evaluate(scope));
            var second_calc = "none";
            if(String(result[0].secondary_formula) != "N/A"){
                second_calc = Math.round(math.compile(String(result[0].secondary_formula)).evaluate(scope));
            }
                item.description = result[0].description;
            if(typeof item.description =='string'){
                item.description = item.description.replace('$',first_calc.toString(10));
        
                if(second_calc != "none")
                item.description = item.description.replace('@',second_calc.toString(10));
            }
            item.name = result[0].name;
            item.rarity = result[0].rarity;
            item.number = stack;
        }catch(e){
            return item;
        }
        console.log(item.description);
    });

    await sleep(1000);
    return item;
}

function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  
bot.login(config.BOT_TOKEN);


/*
var sql = "CREATE TABLE items (rarity VARCHAR(255),description VARCHAR(255), name VARCHAR(255), formula VARCHAR(255), secondary_formula VARCHAR(255), search_key VARCHAR(255) )";
connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("Table created");
});


const fileName = "risky spreadsheet.csv"; 
  
csvtojson().fromFile(fileName).then(source => { 
  
    // Fetching the data from each row  
    // and inserting to the table "sample" 
    for (var i = 0; i < source.length; i++) { 
        var rarity = source[i]["rarity"], 
            description = source[i]["description"], 
            name = source[i]["name"], 
            formula = source[i]["formula"],
            second_formula = source[i]["secondary_formula"],
            key = source[i]["search key"]
  
        var insertStatement =  
        "INSERT INTO items values(?, ?, ?, ?,?,?)"; 
        var items = [rarity,description, name,formula,second_formula,key]; 
  
        // Inserting data of current row 
        // into database 
        connection.query(insertStatement, items,  
            (err, results, fields) => { 
            if (err) { 
                console.log( 
    "Unable to insert item at row ", i + 1); 
                return console.log(err); 
            } 
        }); 
    } 
    console.log( 
"All items stored into database successfully"); 
}); 
*/