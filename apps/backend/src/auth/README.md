## auth runs on the following endpoints:
### Logging in:
\auth\login  [POST]

json struct:
{
    "identifier":"",
    "password":""
}
identifier is email/username 

creates access tokens

return 

{
    user:
    accessToken:
    refreshToken:
}
tokens are jwt token
### Register:
\auth\register [POST]
{
    "username":"",
    "email":"",
    "first_name":"",
    "last_name":"",
    "phone":"",
    "role":"",
    "password":""
}
firstname lastname phone and roles are optional
role wld be defaulted to user

return 
{
    user:
    accessToken:
    refreshToken:
}
access token expires in 15mins
refresh token expires in 7 days

tokens are in the form of JWT (role in acc token for authorisation etc.)

in access token --> subject, accountId, role, type
in refresh token --> subject (userId),accountId, type

returns refresh token, access token
### Logging out:
\auth\logout [POST]
{

    "refreshToken":""

}
logging  out revokes existing refresh token being used

return 

{
    success:true
}

### Create new access token:
\auth\refresh [POST]
{
    "refreshToken": ""
}
when access tokens runs out , call this api with refresh token to get more access token 

return:
{
    accessToken
}

note to all:
secret for jwt_accesss_secret: 'dev-access-secret'
secret for jwt_refresh_secret: 'dev-refresh-secret'

