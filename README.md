# CryptoBallot
The concept of integrating blockchain technology into voting systems represents a paradigm shift in ensuring transparent, secure and accessible elections. Our goal is to implement a decentralized and secure framework that can potentially address these challenges by using one of most innovative and cutting edge technology: blockchain. 


Database creation: 
1. **User table**: [ID, NAME, SURNAME, EMAIL, HASH_PASS, WALLET]  
2. **Friends**: [ID, FRIENDS_ID]
2. **Ballot table**: [ID, NAME, DESCRIPTION, ID_CRETOR (user_id), NAME_CREATOR, SURNAME_CREATOR, START_DATE, END_DATE]  
4. **Ballot voters**: [ID_BALLOT, ID_VOTER (user_id)]
3. **Bookmark**: [ID_USER, ID_BALLOT]
