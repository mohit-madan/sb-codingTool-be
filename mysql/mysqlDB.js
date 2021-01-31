const mysql = require('mysql');

const mysqlConnection = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'survey_buddy'
};

const projectSchema = `CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT, 
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    header_row INT DEFAULT 1,
    doc_key VARCHAR(255) NOT NULL,
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    lang VARCHAR(100) DEFAULT 'English',
    created_by VARCHAR(24),
    assigned_to VARCHAR(24),
    total_responses INT,
    PRIMARY KEY(id)
    )`;
 
const questionSchema = `CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT,
    description TEXT NOT NULL,
    percentage_of_coded FLOAT,
    project_id INT,
    PRIMARY KEY(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
    )`;

const responseSchema = `CREATE TABLE IF NOT EXISTS responses (
   id INT AUTO_INCREMENT,
   description VARCHAR(255) NOT NULL,
   translated_desc VARCHAR(255) NOT NULL,
   lang VARCHAR(100) DEFAULT 'English',
   question_id INT,
   PRIMARY KEY(id),
   FOREIGN KEY(question_id) REFERENCES questions(id)
   )`;  
 
const codebookSchema = `CREATE TABLE IF NOT EXISTS codebooks (
   id INT AUTO_INCREMENT,
   code_word VARCHAR(100),
   length INT NOT NULL,
   project_id INT,
   question_id INT,
   response_id INT,
   PRIMARY KEY(id),
   FOREIGN KEY(project_id) REFERENCES projects(id),
   FOREIGN KEY(question_id) REFERENCES questions(id),
   FOREIGN KEY(response_id) REFERENCES responses(id)
   )`;   

const db = mysql.createConnection(mysqlConnection);
db.connect((err) => {
    if(err)
        console.log(`Conection error: ${err.stack}`);
    else
        console.log('Connected to MySQL Database successfully');
        //CodebooksSchema
        //projectSchema
        db.query(projectSchema, (err, result)=>{
            if(err) console.log(`Error during create Projects table: ${err}`);
            // else console.log('Projects table is created successfully');
        });
        //QuestionsSchema
        db.query(questionSchema, (err, result)=>{
            if(err) console.log(`Error during create Questions table: ${err}`);
            // else console.log('Questions table is created successfully');
        });
        //ResponsesSchema
        db.query(responseSchema, (err, result)=>{
            if(err) console.log(`Error during create Responses table: ${err}`);
            // else console.log('Responses table is created successfully');
        });
        db.query(codebookSchema, (err, result)=>{
            if(err) console.log(`Error during create Codebooks table: ${err}`);
            // else console.log('Codebooks table is created successfully');
        });
        
        
        

});

module.exports = db;