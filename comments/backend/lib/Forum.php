<?php

////////////// ERROR LIST ///////////////////////////////////////
// 001. CONTEXT
const ERROR_UNKNOWN_CMD                     = "#001.001";
const ERROR_FORUM_EMPTY_ID                  = "#001.002";

// 002. INIT SERVER CONFIG
const ERROR_CANT_LOAD_SERVERCONFIG          = "#002.001";
const ERROR_CANT_PARSE_SERVERCONFIG         = "#002.002";

// 003. INIT FORUM CONFIG
const ERROR_WRONG_FORUM_ID                  = "#003.001";
const ERROR_CANT_LOAD_FORUMCONFIG           = "#003.002";
const ERROR_CANT_PARSE_FORUMCONFIG          = "#003.003";

// 004. SAVE FORUM CONFIG
const ERROR_CANT_ENCODE_FORUMCONFIG         = "#004.001";
const ERROR_CANT_SAVE_FORUMCONFIG           = "#004.002";
const ERROR_CANT_CREATE_FORUM_FOLDER        = "#004.003";

// 005. PAGE SAVE/LOAD
const ERROR_PAGE_EMPTY_ID                   = "#005.001";
const ERROR_CANT_SAVE_PAGE                  = "#005.002";

// 006. ADD COMMENT
const ERROR_CANT_ADD_COMMENT_EMPTY_MSG       = "#006.001";

// 007. COMMON COMMENT
const ERROR_CANT_LOAD_COMMENTS              = "#007.001";
const ERROR_CANT_PARSE_COMMENTS             = "#007.002";

// 008. USERS
const ERROR_CANT_LOAD_USERS                 = "#008.001";
const ERROR_CANT_PARSE_USERS                = "#008.002";
const ERROR_CANT_SAVE_USERS                 = "#008.003";
const ERROR_CANT_ENCODE_USERS               = "#008.004";
const ERROR_USER_EMAIL_EMPTY                = "#008.005";
const ERROR_USER_NAME_EMPTY                 = "#008.006";

// 009. AUTH CODES
const ERROR_CANT_LOAD_AUTH_CODES            = "#009.001";
const ERROR_CANT_PARSE_AUTH_CODES           = "#009.002";
const ERROR_CANT_ENCODE_AUTH_CODES          = "#009.003";
const ERROR_CANT_SAVE_AUTH_CODES            = "#009.004";
const ERROR_AUTH_CODE_EMPTY_EMAIL            = "#009.005";


////////////////////////////////////////////////////////////////
const DEF_USER_INFO = [
    "name"=>"",    
    "email"=>""
];

const DEF_COMMENT_DATA = [
    "msg"=>"",    
    "id"=>"",
    "uid"=>null,
    "created"=>null
];

const DEF_PAGE_INFO = [
    "created"=>"",
    "ownerName"=>"",
    "ownerEmail"=>"",
    "commentCounter"=>1,
    "comments"=>[],
];

class Page
{
    private $info =  [];
    private $intID = null;
    public  $lastError = "";
    private $pagePath = "";

    public static function build($pubID){
        $obj = new Page();
        $obj->pubID = $pubID;
        $obj->init();        
        return $obj;
    }

    protected function setError($errorCode){
        $this->lastError = $errorCode;
        return False;
    }

    public function getUserID(){
        $uid = http_post_param('uid');
        /*$email = http_post_param('email');
        if(''==$email) return $this->setError(ERROR_USER_EMAIL_EMPTY);
        $name = http_post_param('name');
        if(''==$name) return $this->setError(ERROR_USER_NAME_EMPTY);
        */
        //
        $userID = Forum::$o->getUserID($email,$name);
        if(False==$userID){
            $this->lastError = Forum::$o->lastError;
        }
        return $userID;
    }

    public function addComment(){
        // Load page
        if(!$this->load()) return False;
        // Validate user
        $userID = $this->getUserID();
        if(False==$userID) return False;
        // Init new comment
        $comment = DEF_COMMENT_DATA;
        $comment['uid'] = $userID;
        $comment['created'] =  date("Y-m-d H:i:s");
        //
        $comment['msg'] = http_post_param('msg');
        if(''==$comment['msg']) return $this->setError(ERROR_CANT_ADD_COMMENT_EMPTY_MSG);
        //
        $comment['id'] = $this->info['commentCounter']++;
        array_push($this->info['comments'],$comment);
        /// Save  
        if(!$this->save()) return False;
        /// Send notification
        $this->notify($comment);
        return True;        
    }

    private function notify($comment){
        $uid= $comment['uid'];
        $user = Forum::$o->getUserByID($uid);
        $userName = False==$user?"Unknown user":$user['name'];
        $userEmail = False==$user?"":$user['email'];
        $pageURL = $_SERVER['HTTP_REFERER'];
        $message = $comment['msg'];

        $email = [
            "to"=>[
                [ // add page owner
                    "email"=>$this->info['ownerEmail'],
                    "name"=>$this->info['ownerName'],
                ]            
            ],
            "toUserIDs"=>[],
            "subject"=>"New comment added by {$userName}",
            "body"=> <<<EOL
            {$userName} commented: {$message}<br/>
            <br/>
            View <a href="{$pageURL}">comments</>
EOL
        ];  
        $email['toUserIDs'] = array_values(
            array_unique(
                array_values(
                    array_map(
                        function ($user){return $user['uid'];},$this->info['comments']
                    )
                )
            )
        );
        $email['toUserIDs'] = array_values(array_filter( // exclude current comment author
            $email['toUserIDs'],function($userID) use ($uid){return $userID!=$uid;}
        ));

        
        Forum::$o->sendEmail($email);
    }
    
    public function getExtendedComments(){
        // return empty data for non-created page
        if(null==$this->intID) return [
            'comments'=>[],
            'users'=>[]
        ];
        // load data for existing page
        if(False==$this->load()) return False;
        //        
        $comments = $this->info['comments'];
        //
        $usersInfo = Forum::$o->loadUsersInfo();
        if(False===$usersInfo){
            $this->setError(Forum::$o->lastError);
            return False;        
        }
        //          
        $userList = [];
        foreach ($comments as &$comment) {
            // find user by UID            
            $uid = $comment['uid'];
            $email = "";
            $user = null;
            if(!array_key_exists($uid,$usersInfo['list'])){    
                $user = [
                    'id'=>$uid,
                    'email'=>'',
                    'name'=>'Deleted user #'.$uid.json_encode($usersInfo)
                ];
            }else{
                $user = $usersInfo['list'][$uid];
            }            
            $userList[$uid] = $user;            
            //            
        }
        return [
            'comments'=>$comments,
            'users'=>$userList
        ];
    }

    protected function init(){
        $forum  = Forum::$o;
         // Check data
         if("" == $this->pubID) return $this->setError(ERROR_PAGE_EMPTY_ID);
        //        
        $this->intID = $forum->getPageIntIDByPubID($this->pubID);
        if(False==$this->intID) $this->intID = null;
        return True;
    }

    protected function load(){
        $forum  = Forum::$o;
         // Check data
        if("" == $this->pubID) return $this->setError(ERROR_PAGE_EMPTY_ID);
        
        // find page data in forum config   
        $this->intID = $forum->getPageIntIDByPubID($this->pubID);
        if(False==$this->intID){
            // create new page
            $this->intID = $forum->generatePageIntIDForPubID($this->pubID);
            $this->info = DEF_PAGE_INFO;                        
            $this->info['ownerName'] =  http_post_param("pageOwnerNam");
            $this->info['ownerEmail'] =  http_post_param("pageOwnerEmail");
            if(False===$this->saveToJSON())
                return $this->setError(ERROR_CANT_SAVE_PAGE);            
        }else{
            $this->info = $this->loadJSON();
            if(""!=$this->lastError) return False;
        }
        //        
        return True;
    }

    protected function save(){
        return $this->saveToJSON();
    }

    private function getJSONPath(){
        return  Forum::$o->getBasePage()."/page-".$this->intID.".json";
    }

    protected function loadJSON(){        
        // check if page config exists
        if(!file_exists($this->getJSONPath())) return DEF_PAGE_INFO;       

        $content = file_get_contents($this->getJSONPath());
        if($content===FALSE){
            $this->setError(ERROR_CANT_LOAD_COMMENTS);        
            return [];
        }               
        // decode a text config into a array
        $json = json_decode( $content, true );
        if($json==NULL){
            $this->setError(ERROR_CANT_PARSE_COMMENTS);        
            return [];
        }    

        return $json;
    }

    protected function saveToJSON(){
         // encode an array into a json
         $text = json_encode($this->info);
         if($text===False){
            $this->setError(ERROR_CANT_ENCODE_FORUMCONFIG);       
            return False;
         }   
         // save into a file
         if( False===file_put_contents($this->getJSONPath(),$text)){
            $this->setError(ERROR_CANT_SAVE_FORUMCONFIG);       
            return False;
         }
         return True;

    }

    
}

////////////////////////////////////////////////////////////////

const DEF_FORUM_CONFIG = [
    "name"=> "default",
    "pageCounter"=>1,
    "pages"=>[],    
];

class Forum
{
    public static $o = null;

    public $lastError = "";
    private $forumID = "";
    private $basePath = "";
    private $forumConfigPath = "";
    private $usersFilePath = "";
    private $config =null;
    private $serverConfig = null;
    private $users = null;
    
    public static function build($forumID){
        $obj = new Forum();
        $obj->forumID = $forumID;
        if($obj->init())
            return $obj;
        else {
            return $obj->lastError;
        }
    }

    public function forumID(){
        return $this->forumID;
    }

    public function generatePageIntIDForPubID($pagePubID){
        $newIntID = $this->config['pageCounter']++;
        $this->config['pages'][  $pagePubID ] = $newIntID;
        
        if(False===$this->saveForumConfig()) return False;

        return True;
    }
    public function getPageIntIDByPubID($pubID){
        if(!array_key_exists($pubID,$this->config['pages'])){
            return False;
        }
        return $this->config['pages'][$pubID];
    }    
    
    public function login(){
        $email = http_post_param('email');
        if(""==$email){            
            $this->setError(ERROR_AUTH_CODE_EMPTY_EMAIL);       
            return False;
        }
        //
        $code = $this->_createAuthCode($email);        
        if(False===$code) return False;
        if(False===$this->_loginSendCode($email,$code)) return False;    
        //
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo) return False;
        $uid = $this->findUserIDByEmail($usersInfo,$email);

        $result = [
            "exists"=>False!==$uid
        ];
        //
        return $result;
    }

    private function _createAuthCode($email){
        // Create new code 
        $code = rand(1000,9999);        
        // Load existing codes
        $codes = $this->_loadAuthCodes();
        if(False===$codes) return False;
        // Update codes
        $codes[$email] = $codes;
        // Saves codes back
        if(False==-$this->_saveAuthCodes($codes)) return False;
        return $code;
    }

    private function _loadAuthCodes(){
        $codes = [
            // "test@test.com" => 2323445
        ];  
        if(!file_exists($this->authCodesPath)) return $codes;

        // read existing file
        $content = file_get_contents($this->authCodesPath);
        if($content===FALSE) return $this->setError(ERROR_CANT_LOAD_AUTH_CODES);

        // decode a text config into a array
        $codes = json_decode( $content, true );
        if($codes==NULL) return $this->setError(ERROR_CANT_PARSE_AUTH_CODES);        

        return $codes;
    }

    protected function _saveAuthCodes($codes){
         // encode an array into a json
         $text = json_encode($codes);
         if($text===False){
            $this->setError(ERROR_CANT_ENCODE_AUTH_CODES);       
            return False;
         }   
         // save into a file
         if( False===file_put_contents($this->authCodesPath,$text)){
            $this->setError(ERROR_CANT_SAVE_AUTH_CODES);       
            return False;
         }
         return True;

    }

    private function _loginSendCode($email,$code){
        $email = [
            "to"=>[
                [ // 
                    "email"=>$email               
                ]            
            ],
            "toUserIDs"=>[],
            "subject"=>"Authorization code",
            "body"=> <<<EOL
            Put the following code into login form<br/>
            <b>{$code}</b>
EOL
        ];        
    
        return Forum::$o->sendEmail($email);
    }


    public function buildPage(){
        $pagePubID = $_SERVER['HTTP_REFERER'];
        return Page::build($pagePubID);
    }

    public function sendEmail($email){
        $serverForumConfig = $this->serverConfig[$this->forumID];
        // Check if email configured in server config
        if(!array_key_exists("email",$serverForumConfig)) return;

        $toEmails = array_merge( $email['to'], $this->_sendEmail_uidsTo( $email['toUserIDs'] ));


        $data = [
            "personalizations"=>[[
                "to" => $toEmails,
            ]],
            "subject"=>$email['subject'],            
            "from"=> [
                "email"=> $serverForumConfig["email"]["from-email"]
            ],    
            "content"=>[
                [
                    "type"=> "text/html",
                    "value"=> $email['body']
                ]
            ],                
        ];
        $dataStr = str_replace("\/","/",json_encode($data));
        // Use sendgrid service
        $sgKey =  $serverForumConfig['email']['sendgrid-key'];
        if(null!=$sgKey){
            $cmd = <<<EOL
curl --request POST --url https://api.sendgrid.com/v3/mail/send --header "Authorization: Bearer {$sgKey}" --header 'Content-Type: application/json' --data '{$dataStr}'
EOL;
            $res = shell_exec($cmd);            
      }
      return True;
    }

    private function _sendEmail_uidsTo($uids){
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo){
            $this->setError(Forum::$o->lastError);
            return False;        
        }
        return array_map(function($uid) use ( $usersInfo){
            if(!array_key_exists($uid,$usersInfo['list'])){    
                return [
                    'email'=>'',
                    'name'=>'Deleted user #'.$uid
                ];
            }else{                
                $user = $usersInfo['list'][$uid];
                return [
                    'email'=>$user['email'],
                    'name'=>$user['name']
                ];
            }  
        },$uids);
    }


    public function getUserID($email,$name){
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo) return False;
        //
        $uid = $this->findUserIDByEmail($usersInfo,$email);
        if(False==$uid){
            $uid = $usersInfo['userCounter']++;
            $usersInfo['list'][$uid] = [
                "id"=>$uid,
                "email"=>$email,
                "name"=>$name,
            ];
            if(False===$this->saveUsersInfo($usersInfo)) return False;                    
        }
        return $uid;
    }

    public function getUserByID($uid){
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo) return False;
        //
        if(!array_key_exists($uid,$usersInfo['list'])) return False;
        return $usersInfo['list'][$uid];
    }

    private function findUserIDByEmail(&$usersInfo,$email){
        $foundUsers = array_values(array_filter(array_values($usersInfo['list']),function($u) use ($email){
            return $u['email']==$email;
        }));
        return count( $foundUsers )>0? $foundUsers[0]['id']:False;
    }

    protected function init(){
        // Check data
        if("" == $this->forumID){
            $this->setError(ERROR_FORUM_EMPTY_ID);
            return False;
        }
        // Check server id
        {
            // Load server config
            $this->serverConfig = $this->loadServerConfig();
            if($this->lastError!="") return False;

            // Check forum existing
            if(!array_key_exists($this->forumID,$this->serverConfig)){
                $this->setError(ERROR_WRONG_FORUM_ID);
                return False;
            }
        }
        // Load forum config
        {
            $this->basePath = 'data/'.$this->forumID;
            $this->forumConfigPath = $this->basePath."/forum.json";
            $this->usersFilePath = $this->basePath."/users.json";
            $this->authCodesPath = $this->basePath."/auth-codes.json";

            $this->config = $this->loadForumConfig();
            if($this->lastError!="")return False;

            // Create new config
            if(False==$this->config){                
                $this->config = DEF_FORUM_CONFIG;
                if(False===$this->saveForumConfig()) return False;
            }
    
        }
        // Get user ID  (can be empty)
        {
            $this->uid = http_post_param('uid');
        }
        // ok
        Forum::$o = $this;
        return True;
    }

    public function getBasePage(){
        return $this->basePath;
    }

    /*
        Result: [
            "userCounter"=>1,
            "list":[
                {id=>2,name=>"sddd",email=>"dddd}
            ]
        ]
    */
    public function loadUsersInfo(){
        if(!file_exists($this->usersFilePath)) return [
            "userCounter"=>1,
            "list"=>[]
        ];

        // read existing file
        $content = file_get_contents($this->usersFilePath);
        if($content===FALSE){
            $this->setError(ERROR_CANT_LOAD_USERS);
            return False;
        }
         // decode a text config into a array
        $data = json_decode( $content, true );
        if($data==NULL){
            $this->setError(ERROR_CANT_PARSE_USERS);        
            return False;
        }   
        return $data;
    }


    ////////////////////////////////////////////////////////////////////////////////


    protected function setError($errorCode){
            $this->lastError = $errorCode;
            return False;
    }


    protected function loadServerConfig(){
        $configPath = "config/forums.json";

        // read existing test onfig
        $content = file_get_contents($configPath);
        if($content===FALSE){
            $this->setError(ERROR_CANT_LOAD_SERVERCONFIG);
            return [];
        }                       
        // decode a text config into a array
        $config = json_decode( $content, true );
        if($config==NULL){
            $this->setError(ERROR_CANT_PARSE_SERVERCONFIG);        
            return [];
        }    

        return $config;
    }
    
    protected function saveUsersInfo($usersInfo){
         // encode an array into a json
         $text = json_encode($usersInfo);
         if($text===False){
            $this->setError(ERROR_CANT_ENCODE_USERS);       
            return False;
         }   
         // save into a file
         if( False===file_put_contents($this->usersFilePath,$text)){
            $this->setError(ERROR_CANT_SAVE_USERS);       
            return False;
         }
         return True;

    }

    protected function loadForumConfig(){

        if(!file_exists($this->forumConfigPath)) return False;

        // read existing config
        $content = file_get_contents($this->forumConfigPath);
        if($content===FALSE){
            $this->setError(ERROR_CANT_LOAD_FORUMCONFIG);
            return False;
        }
         // decode a text config into a array
        $config = json_decode( $content, true );
        if($config==NULL){
            $this->setError(ERROR_CANT_PARSE_FORUMCONFIG);        
            return False;
        }   
        return $config;
    }

    protected function saveForumConfig(){
        //
        $isNewForum = !file_exists($this->forumConfigPath);
        if($isNewForum){
            // init new config
            if(False==mkdir($this->basePath)){
                $this->setError(ERROR_CANT_CREATE_FORUM_FOLDER);       
                return False;
            }
        }

         // encode an array into a json
         $text = json_encode($this->config);
         if($text===False){
            $this->setError(ERROR_CANT_ENCODE_FORUMCONFIG);       
            return False;
         }   
         // save into a file
         if( False===file_put_contents($this->forumConfigPath,$text)){
            $this->setError(ERROR_CANT_SAVE_FORUMCONFIG);       
            return False;
         }
         return True;

    }

}
?>

