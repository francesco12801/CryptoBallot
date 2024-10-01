# CryptoBallot
The concept of integrating blockchain technology into voting systems represents a paradigm shift in ensuring transparent, secure and accessible elections. Our goal is to implement a decentralized and secure framework that can potentially address these challenges by using one of most innovative and cutting edge technology: blockchain. 


Database creation: 
1. **User table**: [ID, NAME, SURNAME, EMAIL, HASH_PASS, WALLET]  
2. **Friends**: [ID, FRIENDS_ID]
3. **Ballot table**: [ID, NAME, DESCRIPTION, ID_CRETOR (user_id), NAME_CREATOR, SURNAME_CREATOR, START_DATE, END_DATE]  
4. **Ballot voters**: [ID_BALLOT, ID_VOTER (user_id)]
5. **Bookmark**: [ID_USER, ID_BALLOT]

Pratical DB: 
1. **User**: [ID (Primary Key), NAME, SURNAME, EMAIL (Unique), HASH_PASS, WALLET]
2. **Friends**: [USER_ID (Foreign Key), FRIEND_ID (Foreign Key)]
3. **Ballot**: [ID (Primary Key), NAME, DESCRIPTION, ID_CREATOR (Foreign Key to User), CREATED_AT, END_DATE]
4. **BallotVoters**: [ID_BALLOT (Foreign Key to Ballot), ID_VOTER (Foreign Key to User), CREATED_AT]
5. **Bookmark**: [ID_USER (Foreign Key to User), ID_BALLOT (Foreign Key to Ballot)]


**How to use .env files**
Create .env file and the following constant variables, fill them with personal data related to PostGre: 
- DB_NAME=""
- DB_USER=""
- DB_PASSWORD=""
- DB_HOST="localhost"
- DB_PORT="5432"
Then run py script to create tables. 

