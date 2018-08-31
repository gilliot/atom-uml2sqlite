'use babel';

//import Uml2sqliteView from './uml2sqlite-view';
import { CompositeDisposable } from 'atom';

export default {

  uml2sqliteView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'uml2sqlite:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    console.log('Uml2sql was toggled!');
    editor = atom.workspace.getActiveTextEditor();
    var umlText = editor.getText();
    //editor.insertText("OK");

    promise = atom.workspace.open();

    promise.then( function(sqlEditor){
      //editor = atom.workspace.getActiveTextEditor();
      //sqlEditor.setText(umlText);

      sqlEditor.insertText("-- uml2sql\n\n");

      // check if it is a plantUML file
      if (umlText.indexOf("@startuml") != -1 ){

      var lines = umlText.split("\n");
      var inTable = false;
      var inPackage = false;
      var tableName="";


      for(var i = 0;i < lines.length;i++){

        theLine = lines[i].trim();
        minus = theLine.toLowerCase();

        // start package
        if (minus.substring(0,5) == "packa"){
          inPackage=true;
          packageName=theLine.substring(7,theLine.length-1);
        }
        // start of class (table) definition
        if (minus.substring(0,6) == "class "){
          var fieldsNb = 0;
          var theIndexes = [];
          var primeryKeys = [];


          tableName = theLine.substring(5,100).replace("{","").trim();
          sqlEditor.insertText("\nCREATE TABLE IF NOT EXISTS ");
          sqlEditor.insertText(tableName);
          sqlEditor.insertText("(\n");
          inTable = true;
          if (inPackage){
            sqlEditor.insertText("-- PACKAGE ");
            sqlEditor.insertText(packageName);
            sqlEditor.insertText("\n");
          }
          // search for a possible Table comment
          var comment=false;
          var commentLine=0;

          for (j=i+1;j < (i + 5);j++){
            nextLine = lines[j].trim();
            if (nextLine.substring(0,2)=="==") {
              comment=true;
              commentLine = j;
            }
          }


          if (comment){
            for (j=i+1;j < commentLine;j++){
              nextLine = lines[j].trim();
              if (nextLine.length > 0){
                sqlEditor.insertText("-- ");
                sqlEditor.insertText(nextLine);
                sqlEditor.insertText("\n");
              }
            }
            i = commentLine + 1;
          } else {
            i++;
          }
         comment=false;
         theLine = lines[i].trim();
         minus = theLine.toLowerCase();


        } // end if start TABLE

        // end of class or package definition
        if (minus=="}") {
          if (inTable){
           inTable = false;
           fieldsNb=0;

           if (primeryKeys.length > 0){
             sqlEditor.insertText(",");
             if (primeryKeys.length ==1){ // only one primary key
               fieldLine = primeryKeys[0].split(':').join(' ').split(/\s+/g);
               sqlEditor.insertText("\n"+fieldLine[0]+ " "+fieldLine[1]);
               sqlEditor.insertText(" PRIMARY KEY ");
               for (var k=2;k<fieldLine.length;k++){
                 sqlEditor.insertText(fieldLine[k]);
                 sqlEditor.insertText(" ");
               }
             } else { // several field as primary key other syntax
               for (m=0;m<primeryKeys.length;m++){
                 fieldLine2 = primeryKeys[m].split(':').join(' ').split(/\s+/g);
                 if (m>0){
                   sqlEditor.insertText(", ");
                 }
                 sqlEditor.insertText("\n"+fieldLine2[0]+ " ");
                 sqlEditor.insertText(fieldLine2[1]);

               }
             sqlEditor.insertText(",\nPRIMARY KEY(");
             for (m=0;m<primeryKeys.length;m++){
               fieldLine = primeryKeys[m].split(':').join(' ').split(/\s+/g);
               if (m>0){
                 sqlEditor.insertText(", ");
               }
               sqlEditor.insertText(fieldLine[0]);
             }
             sqlEditor.insertText(")");
           }
           primeryKeys=[];
         }
           sqlEditor.insertText("\n);\n\n");

           if (theIndexes.length > 0){
             for (m=0;m<theIndexes.length;m++){
               idx = "CREATE INDEX IF NOT EXISTS idx_";
               idx += theIndexes[m];
               idx += " ON " + tableName + "(" + theIndexes[m] + ");\n";
               sqlEditor.insertText(idx);
             }
           }
           theIndexes=[];
           primeryKeys=[];
         } else {
           inPackage = false;
         }
        }


        // fields ?
       if (inTable){
         if (theLine.length > 0){
           // separator ":"" or "<space>"
           fieldsNb++;
           fieldLine = theLine.split(':').join(' ').split(/\s+/g);
           name = fieldLine[0];
           // forein key rule or field ?
           // FK must be at the end of fields definition in sqlite
           if (name.toUpperCase() == "_FK_"){
             // primary keys process before FK if exist
             if (primeryKeys.length > 0){
               sqlEditor.insertText(",");
               if (primeryKeys.length ==1){ // only one primary key
                 fieldLine2 = primeryKeys[0].split(':').join(' ').split(/\s+/g);
                 sqlEditor.insertText("\n"+fieldLine2[0]+ " "+fieldLine2[1]);
                 sqlEditor.insertText(" PRIMARY KEY ");
                 for (var k=2;k<fieldLine2.length;k++){
                   sqlEditor.insertText(fieldLine2[k]);
                   sqlEditor.insertText(" ");
                 }
               } else { // several field as primary key other syntax
               for (m=0;m<primeryKeys.length;m++){
                 fieldLine2 = primeryKeys[m].split(':').join(' ').split(/\s+/g);
                 if (m>0){
                   sqlEditor.insertText(", ");
                 }
                 sqlEditor.insertText("\n"+fieldLine2[0]+ " ");
                 sqlEditor.insertText(fieldLine2[1]);

               }

               sqlEditor.insertText(",\nPRIMARY KEY(");
               for (m=0;m<primeryKeys.length;m++){
                 fieldLine2 = primeryKeys[m].split(':').join(' ').split(/\s+/g);
                 if (m>0){
                   sqlEditor.insertText(", ");
                 }
                 sqlEditor.insertText(fieldLine2[0]);
               }
               sqlEditor.insertText(")");
             }
             primeryKeys=[];
           }


            // Foreign keys

             if (fieldsNb > 1){
               sqlEditor.insertText(",\n");
             }
             sqlEditor.insertText("FOREIGN KEY(");
             sqlEditor.insertText(fieldLine[1]+ ") REFERENCES ");
             sqlEditor.insertText(fieldLine[2]);

           } else {
           // is field KEY ?
           if (name[0]=="#"){
             primeryKeys.push(theLine.replace("#",""));
             fieldsNb--;
             continue;
           }

           if (name[0]=="+"){
             name = name.substring(1,100);
             theIndexes.push(name);
           }

           if (fieldsNb > 1){
             sqlEditor.insertText(",\n");
           }
           sqlEditor.insertText(name);
           sqlEditor.insertText(" ");

           for (var k=1;k<fieldLine.length;k++){
             sqlEditor.insertText(fieldLine[k]);
             sqlEditor.insertText(" ");
           }

         } //  if _FK_

         } // length > 0

       } else { // else if in table
         if (theLine[0]=="'"){ // plantUML comment
           sqlEditor.insertText("-- "+theLine.substring(1,100)+"\n");
         }


       }



      } // end for all lines


      } else {
        sqlEditor.insertText("Not a PlantUML file");
      }



    }); // promise


  } // toogle

}; // export
