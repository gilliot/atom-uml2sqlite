# atom-uml2sqlite
convert plantUML Class diagram to Sqlite SQL script

 ## Description 

uml2sqlite convert database structure in  UML code in the curent pane into SQL creation table code for [Sqlite](https://www.sqlite.org) in a new pane.

 ## General syntax
UML database structure must match the
[plantUML](http://plantuml.com/) syntax. Tables must be coded as [plantUML Class diagram](http://plantuml.com/class-diagram) :
```
Class Table1{
' Comment
#id INTEGER
Field1 Type
+Field2 : Type
Field3 : Type UNIQUE
Field4 Type
t2_id INTEGER
_FK_ t2_id Table2(id)
}
```
one instruction per line

## Field syntax

```<Field name> <Field <type> <extra>```

Seperators could be one or several ```<space>``` or a ":"

```<type>``` All possible sqlite field types

```<extra>``` Some extra field constraint such as: UNIQUE, NOT NULL, AUTOINCREMENT

## Primary key
Each field that is a primary key is preceded by the symbol "#". It is possible to define several primary keys.
## indexed field
each field to be indexed is preceded by the symbol "+"
## Foreign key constraint
Foreign key constraint could be added among the field lines. Foreign key line must started with the characters: "_FK_", in the previous example:

_FK_ t2_id Table2(id)

t2_id is a field in the current table (Table1) id is a field in an other table (Table2)
