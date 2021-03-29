<?php

////////////// ERROR LIST ///////////////////////////////////////
// 001. CONTEXT
const ERROR_UNKNOWN_CMD                     = "#001.001";
const ERROR_FORUM_EMPTY_ID                  = "#001.002";
const ERROR_COMMON_DROP_SESSION             = "#001.003";

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

// 009. SEND AUTH CODE
const ERROR_LOGIN_CANT_LOAD_AUTH_CODE            = "#009.001";
const ERROR_LOGIN_CANT_SAVE_AUTH_CODE            = "#009.002";
const ERROR_LOGIN_CANT_CREATE_AUTHCODES_FOLDER    = "#009.003";
const ERROR_LOGIN_AUTH_CODE_EMPTY_EMAIL           = "#009.005";

// 010. AUTH USER
const ERROR_AUTH_CODE_EMPTY                         = "#010.001";
const ERROR_AUTH_EMAIL_EMPTY                         = "#010.002";
const ERROR_AUTH_CODE_WRONG                         = "#010.003";
const ERROR_AUTH_CANT_CREATE_SESSIONS_FOLDER         = "#010.004";
const ERROR_AUTH_CANT_READ_SESSION                   = "#010.005";
const ERROR_AUTH_CANT_SAVE_SESSION                   = "#010.006";
const ERROR_AUTH_CANT_FIND_USER                   = "#010.007";

// 011 PAGE VISITS
const ERROR_PAGE_VISITS_CANT_CREATE_FOLDER           = "#011.001";
const ERROR_PAGE_VISITS_CANT_CREATE_FILE           = "#011.002";
const ERROR_PAGE_VISITS_CANT_DECODE_FILE           = "#011.003";
const ERROR_PAGE_VISITS_CANT_ENCODE_FILE           = "#011.004";
const ERROR_PAGE_VISITS_CANT_SAVE_FILE           = "#011.005";


// 012.REMOVE COMMENT
const ERROR_REMOVE_COMMENT_NOPAGE             = "#012.001";
const ERROR_REMOVE_COMMENT_COMMENTID_EMPTY          ="#012.002";
const ERROR_REMOVE_COMMENT_NOCOMMENT                ="#012.003";
const ERROR_REMOVE_COMMENT_WRONG_OWNER              ="#012.004";

// 013.UPDATE COMMENT
const ERROR_UPDATE_COMMENT_NOPAGE                  = "#013.001";
const ERROR_UPDATE_COMMENT_COMMENTID_EMPTY          ="#013.002";
const ERROR_UPDATE_COMMENT_NOCOMMENT                ="#013.003";
const ERROR_UPDATE_COMMENT_WRONG_OWNER              ="#013.004";
const ERROR_UPDATE_COMMENT_MSG_EMPTY                ="#013.005";

// 014. PROJECT SAVE/LOAD
const ERROR_PROJECT_EMPTY_ID                        = "#014.001";
const ERROR_CANT_LOAD_PROJECT                       = "#014.003";
const ERROR_CANT_PARSE_PROJECT                      = "#014.004";
const ERROR_CANT_ENCODE_PROJECT                     = "#014.005";
const ERROR_CANT_SAVE_PROJECT                       = "#014.006";
const ERROR_CANT_CREATE_PROJECT_FOLDER              = "#014.007";
const ERROR_CANT_LOAD_PROJECT_PAGE                  = "#014.008";


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

if (!function_exists('getallheaders')) {
    function getallheaders() {
    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
    return $headers;
    }
}

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

    public function addComment(){
        $forum = Forum::$o;
        // Load page
        if(!$this->load()) return False;
        // Create if required        
        if(False==$this->intID && !$this->create()) return False;

        // Validate user
        $uid = $forum->uid;
        if(False===$uid) return False;
        // Init new comment
        $comment = DEF_COMMENT_DATA;
        $comment['uid'] = $uid;
        $comment['created'] =  time();
        //
        $comment['msg'] = http_post_param('msg');
        if(''==$comment['msg']) return $this->setError(ERROR_CANT_ADD_COMMENT_EMPTY_MSG);
        //
        if(http_post_param('markX')!=""){
            $comment['markX'] = http_post_param('markX');
            $comment['markY'] = http_post_param('markY');
        }
        //
        $comment['id'] = $this->info['commentCounter']++;
        array_push($this->info['comments'],$comment);
        /// Save  
        if(!$this->save()) return False;
        /// Send notification
        $this->notify($comment);
        return True;        
    }

    public function removeComment(){
        $forum = Forum::$o;
        // Load page
        if(!$this->load()) return False;
        // Skip non-existing page
        if(False==$this->intID) return $this->setError(ERROR_REMOVE_COMMENT_NOPAGE);

        // Try to remove the comment by ID
        $commentID = http_post_param("commentID");
        if(""==$commentID){
            return $this->setError(ERROR_REMOVE_COMMENT_COMMENTID_EMPTY);
        }
        // Check comment ownership
        $commentsToRemove = array_values(array_filter($this->info['comments'],function($c) use ($commentID){            
            return $c['id']==$commentID;
        }));
        if(count( $commentsToRemove )==0){
            return $this->setError(ERROR_REMOVE_COMMENT_NOCOMMENT);
        }
        $commentToRemove =  $commentsToRemove[0];
        if($commentToRemove['uid']!=$forum->uid){
            return $this->setError(ERROR_REMOVE_COMMENT_WRONG_OWNER);
        }
        // Remove
        $this->info['comments'] = array_values(array_filter($this->info['comments'],function($c) use ($commentID){            
            return $c['id']!=$commentID;
        }));
        /// Save  
        if(!$this->save()) return False;
        return True;
    }

    public function updateComment(){
        $forum = Forum::$o;
        // Load page
        if(!$this->load()) return False;
        // Skip non-existing page
        if(False==$this->intID) return $this->setError(ERROR_UPDATE_COMMENT_NOPAGE);

        // Try to remove the comment by ID
        $commentID = http_post_param("commentID");
        if(""==$commentID){
            return $this->setError(ERROR_UPDATE_COMMENT_COMMENTID_EMPTY);
        }
        // Check comment ownership
        $commentsToUpdate = array_values(array_filter($this->info['comments'],function($c) use ($commentID){            
            return $c['id']==$commentID;
        }));
        if(count( $commentsToUpdate )==0){
            return $this->setError(ERROR_UPDATE_COMMENT_NOCOMMENT);
        }
        $commentToUpdate =  $commentsToUpdate[0];
        if($commentToUpdate['uid']!=$forum->uid){
            return $this->setError(ERROR_UPDATE_COMMENT_WRONG_OWNER);
        }
        // Check new data
        $msg = http_post_param("msg");
        if(""==$commentID){
            return $this->setError(ERROR_UPDATE_COMMENT_MSG_EMPTY);
        }
        // UPDATE
        array_walk($this->info['comments'],function($c,$key) use ($commentID,$msg){
            if($c['id']==$commentID)
                $this->info['comments'][$key]['msg'] = $msg;
        });
        /// Save  
        if(!$this->save()) return False;
        return True;
    }

    private function notify($comment){
        $forum = Forum::$o;

        $uid= $comment['uid'];
        $user = Forum::$o->getUserByUID($uid);
        $userName = False===$user?"Unknown user":$user['name'];
        $userEmail = False===$user?"":$user['email'];
        $pageURL = $_SERVER['HTTP_REFERER'];
        $message = $comment['msg'];

        $email = [
            "to"=>[],
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
        // add page owner to notify
        if($this->info['ownerEmail']!="" && $forum->user['email']!=$this->info['ownerEmail']){
            $email['to'] = [
                [ // add page owner
                    "email"=>$this->info['ownerEmail'],
                    "name"=>$this->info['ownerName'],
                ]            
                ];
        }

        // exclude current comment author
        $email['toUserIDs'] = array_values(array_filter( 
            $email['toUserIDs'],function($userID) use ($uid){return $userID!=$uid;}
        ));
        Forum::$o->sendEmail($email);
    }
    
    public function getInfo(){
        // return empty data for non-created page
        $res = [
            'commentsTotal'=>0,
            'commentsNew'=>0
        ];
        if(null==$this->intID) return $res;
        //
        // load data for existing page
        if(False===$this->load()) return False;
        //
        $res['commentsTotal'] = count($this->info['comments']);
        return $res;
    }

    public function getExtendedComments(){
        // return empty data for non-created page
        if(null==$this->intID) return [
            'comments'=>[],
            'users'=>[]
        ];
        // load data for existing page
        if(False===$this->load()) return False;
        $comments = $this->info['comments'];
        // load users info
        $usersInfo = Forum::$o->loadUsersInfo();
        if(False===$usersInfo) return  $this->setError(Forum::$o->lastError);
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
        $visited = $this->getUserVisited(Forum::$o->uid);
        return [
            'comments'=>$comments,
            'users'=>$userList,
            'visited'=>$visited
        ];
    }

    protected function init(){
        $forum  = Forum::$o;
         // Check data
         if("" == $this->pubID) return $this->setError(ERROR_PAGE_EMPTY_ID);
        //        
        $this->intID = $forum->findPageIntIDByPubID($this->pubID);
        return True;
    }

    protected function load(){
        $forum  = Forum::$o;

         // Check ID
        if("" == $this->pubID) return $this->setError(ERROR_PAGE_EMPTY_ID);
        
        // find page data in forum config   
        if(False===$this->intID){
            return True;
        }else{
            $this->info = $this->loadJSON();
            if(""!=$this->lastError) return False;
        }
        //        
        return True;
    }

    protected function create(){
     
        // create new page
        $this->intID = Forum::$o->generatePageIntIDForPubID($this->pubID);

        // update parent project
        $project = Forum::$o->buildProject();
        if(""!=$project->lastError){
            return $this->setError($project->lastError);
        }
        if(!$project->addPageIDs( $this->pubID,$this->intID )){
            return $this->setError($project->lastError);
        }

        // configure itself
        $this->info = DEF_PAGE_INFO;                        
        $this->info['ownerName'] =  http_post_param("pageOwnerName");
        $this->info['ownerEmail'] =  http_post_param("pageOwnerEmail");
        if(False===$this->saveToJSON())
            return $this->setError(ERROR_CANT_SAVE_PAGE);         
        return True;   
    }

    protected function save(){
        return $this->saveToJSON();
    }

    private function getJSONPath(){
        return  Forum::$o->getBasePage()."/page-".$this->intID.".json";
    }


    private function getUserVisitsBasePath(){
        return  Forum::$o->getBasePage()."/page-visits";
    }
    
    private function getUserVisitsPath($uid){
        return $this->getUserVisitsBasePath()."/".$this->intID."-".$uid.".json";
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

    // return previous visited date and save new
    protected function getUserVisited($uid){        
        $visited = time();
        if(""==$uid) return $visited;
        ///
        $data = ["visited"=>$visited];
        // Check if folder "/page-visits" exists
        if(!file_exists($this->getUserVisitsBasePath())) {
            if(False==mkdir($this->getUserVisitsBasePath())) return $this->setError(ERROR_PAGE_VISITS_CANT_CREATE_FOLDER);
        }
        // Read existing file
        $fileName = $this->getUserVisitsPath($uid);
        if(file_exists($fileName)) {
            $dataStr = file_get_contents($fileName);
            $data = json_decode($dataStr,true);
            if($data===False){
                $this->setError(ERROR_CANT_ENCODE_USERS);       
                return False;
            } 
            $visited = $data["visited"];       
        }

        // Save new visited time
        $data["visited"] = time();
    
        // encode an array into a json
        $dataStr = json_encode($data);
        if($dataStr===False){
           $this->setError(ERROR_PAGE_VISITS_CANT_ENCODE_FILE);       
           return False;
        }   
        // save into a file
        if( False===file_put_contents($fileName,$dataStr)){
           $this->setError(ERROR_PAGE_VISITS_CANT_SAVE_FILE);       
           return False;
        }

        return $visited;
   }

    
}

////////////////////////////////////////////////////////////////
const DEF_PROJECT_INFO = [
    "pages"=>[],
];

class Project
{
    private $info =  [];
    private $intID = null;
    public  $lastError = "";

    public static function build($pubID){
        $obj = new Project();
        $obj->pubID = $pubID;
        $obj->init();        
        return $obj;
    }

    protected function setError($errorCode){
        $this->lastError = $errorCode;
        return False;
    }

    protected function init(){
        $forum  = Forum::$o;
         // Check data
         if("" == $this->pubID) return $this->setError(ERROR_PROJECT_EMPTY_ID);    
         //
        $this->intID = $forum->findProjectIntIDByPubID($this->pubID);
        return True;
    }

    protected function load(){
        $forum  = Forum::$o;

         // Check ID
        if("" == $this->pubID) return $this->setError(ERROR_PROJECT_EMPTY_ID);
        
        // find project data in forum config   
        if(False===$this->intID){
            return True;
        }else{
            $this->info = $this->loadJSON();
            if(""!=$this->lastError) return False;
        }
        //        
        return True;
    }

    protected function create(){     
        // create new project
        $this->intID = Forum::$o->generateProjectIntIDForPubID($this->pubID);
        $this->info = DEF_PROJECT_INFO;                        
        if(False===$this->saveToJSON())
            return $this->setError(ERROR_CANT_SAVE_PROJECT);
        return True;   
    }


    public function getProjectInfo(){
        // Load self
        if(!$this->load()) return False;
        //
        $info = [];
        foreach ($this->info["pages"] as $pagePubID => $pageIntID) {
            $page = Page::build($pagePubID);
            if(""!=$page->lastError){
                $this->setError(ERROR_CANT_LOAD_PROJECT_PAGE);
                return False;
            }
            //
            $pageInfo = $page->getInfo();
            if(False==$pageInfo){
                $this->setError(ERROR_CANT_LOAD_PROJECT_PAGE);
                return False;
            }
            //
            $pageName = substr(strrchr($pagePubID, "?"),1);
            $info[$pageName] = $pageInfo;
            //
        }
        return $info;
    }

    public function addPageIDs($pagePubID,$pageIntID){                
        // Load self
        if(!$this->load()) return False;
        // Create if required        
        if(False==$this->intID && !$this->create()) return False;

        // Update page list
        $this->info['pages'][$pagePubID] = $pageIntID;
        return $this->save();
    }

    protected function save(){
        return $this->saveToJSON();
    }

    private function getJSONPath(){
        return  Forum::$o->getBaseProject()."/project-".$this->intID.".json";
    }

    protected function loadJSON(){        
        // check if page config exists
        if(!file_exists($this->getJSONPath())) return DEF_PROJECT_INFO;       

        $content = file_get_contents($this->getJSONPath());
        if($content===FALSE){
            $this->setError(ERROR_CANT_LOAD_PROJECT);        
            return [];
        }               
        // decode a text config into a array
        $json = json_decode( $content, true );
        if($json==NULL){
            $this->setError(ERROR_CANT_PARSE_PROJECT);        
            return [];
        }    

        return $json;
    }

    protected function saveToJSON(){
         // encode an array into a json
         $text = json_encode($this->info);
         if($text===False){
            $this->setError(ERROR_CANT_ENCODE_PROJECT);       
            return False;
         }   
         // save into a file
         if( False===file_put_contents($this->getJSONPath(),$text)){
            $this->setError(ERROR_CANT_SAVE_PROJECT);       
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
    "projectCounter"=>1,
    "projects"=>[]
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
    public $user = [];
    
    public static function build($forumID){
        $obj = new Forum();
        $obj->forumID = $forumID;
        $obj->init();
        return $obj;
    }

    public function forumID(){
        return $this->forumID;
    }

    public function generatePageIntIDForPubID($pagePubID){
        $newIntID = $this->config['pageCounter']++;
        $this->config['pages'][  $pagePubID ] = $newIntID;
        
        if(False===$this->saveForumConfig()) return False;

        return $newIntID;
    }

    public function findPageIntIDByPubID($pubID){
        if(!array_key_exists($pubID,$this->config['pages'])){
            return False;
        }
        return $this->config['pages'][$pubID];
    }    

    public function generateProjectIntIDForPubID($pubID){
        $newIntID = $this->config['projectCounter']++;
        $this->config['projects'][  $pubID ] = $newIntID;
        
        if(False===$this->saveForumConfig()) return False;

        return $newIntID;
    }

    public function findProjectIntIDByPubID($pubID){
        if(!array_key_exists($pubID,$this->config['projects'])){
            return False;
        }
        return $this->config['projects'][$pubID];
    }        
    
    
    public function logout(){
        if(""!=$this->sid){
            $this->_dropSession($this->sid);
            $this->sid = "";
            $this->uid = "";
            $this->user = [];
        }

        return [];
    }

    public function login(){
        $email = http_post_param('email');
        if(""==$email){            
            $this->setError(ERROR_LOGIN_AUTH_CODE_EMPTY_EMAIL);       
            return False;
        }
        //
        $code = $this->_createAuthCode($email);        
        if(False===$code) return False;
        if(False===$this->_loginSendCode($email,$code)) return False;    
        //
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo) return False;
        $user = $this->findUserByEmail($usersInfo,$email);

        $result = [
            "exists"=>False!==$user
        ];
        //
        return $result;
    }

    public function auth(){
        $code = http_post_param('code');
        $email = http_post_param('email');
        $name = http_post_param('name');
        if(""==$code) return  $this->setError(ERROR_AUTH_CODE_EMPTY);
        if(""==$email) return  $this->setError(ERROR_AUTH_EMAIL_EMPTY);        

        // Check code
        $email = $this->_getAuthEmail($code);
        if(False===$email) return False;
        if(""==$email) return $this->setError(ERROR_AUTH_CODE_WRONG);
        
        // Drop auth code file
        $this->_dropAuthCode($code);

        $user = $this->getUserByEmail($email,$name);
        if(False===$user) return False;
        if(null==$user){
            return $this->setError(ERROR_AUTH_CANT_FIND_USER);
        }
        $uid = $user['uid'];

        // Auth user
        {            
            $sid = $this->_createSession($uid);
            if(False===$sid) return False;
            $this->uid = $uid;
            $this->sid = $sid;
        }

        $result = [
            "sid"=>$this->sid,
            "uid"=>$this->uid,
            "user"=>$user,
        ];
        //
        return $result;
    }
    /// Auth codes
    private function _createAuthCode($uid){
        $code = bin2hex(random_bytes(5));        
        if(False===$this->_saveAuthCode($code,$uid)) return False;
        return $code;
    }

    private function _checkAuthCodesFolder(){        
        if(file_exists($this->authCodesPath)) return True;
        // create a folder for session files (only once)
        if(False==mkdir($this->authCodesPath)) return $this->setError(ERROR_LOGIN_CANT_CREATE_AUTHCODES_FOLDER);
        
        return True;
    }
    
    private function _getAuthEmail($code){
        if(False===$this->_checkAuthCodesFolder()) return False;
        
        // Check existing
        $codePath = $this->authCodesPath."/".$code;
        if(!file_exists($codePath)) return "";

        // Read existing session
        $email = file_get_contents($codePath);
        if($email===FALSE) return $this->setError(ERROR_LOGIN_CANT_LOAD_AUTH_CODE);       

        return $email;
    }

    protected function _saveAuthCode($code,$email){     
        if(False===$this->_checkAuthCodesFolder()) return False;
         
        $codePath = $this->authCodesPath."/".$code;
        if( False===file_put_contents($codePath,$email)) return $this->setError(ERROR_LOGIN_CANT_SAVE_AUTH_CODE);       
        return True;
    }

    protected function _dropAuthCode($code){     
        $codePath = $this->authCodesPath."/".$code;

        if(!file_exists($codePath)) return True;
        unlink($codePath);
        return True;
    }
    
    // Sessions
    private function _createSession($uid){
        while(True){
            // Create session ID
            $sid = bin2hex(random_bytes(20));

            // Check existing
            $checkUID = $this->_getSessionUID($sid);
            if(False===$checkUID) return False;

            // Need to generate some other session ID
            if(""!=$checkUID) continue;

            // Create session file            
            if(False===$this->_saveSession($sid,$uid)) return False;
            return $sid;
        }
    }

    private function _checkSessionsFolder(){
        // create a folder for session files (only once)
        $isNewForum = !file_exists($this->sessionsPath);
        if($isNewForum){
            if(False==mkdir($this->sessionsPath)) return $this->setError(ERROR_AUTH_CANT_CREATE_SESSIONS_FOLDER);
        }
        return True;
    }

    private function _getSessionUID($sid){
        if(False===$this->_checkSessionsFolder()) return False;
        
        // Check existing
        $sessionPath = $this->sessionsPath."/".$sid;
        if(!file_exists($sessionPath)) return "";

        // Read existing session
        $uid = file_get_contents($sessionPath);
        if($uid===FALSE) return $this->setError(ERROR_AUTH_CANT_READ_SESSION);       

        return $uid;
    }

    protected function _saveSession($sid,$uid){     
        if(False===$this->_checkSessionsFolder()) return False;
         
        $sessionPath = $this->sessionsPath."/".$sid;
        if( False===file_put_contents($sessionPath,$uid)) return $this->setError(ERROR_AUTH_CANT_SAVE_SESSION);       
        return True;
    }

    
    protected function _dropSession($sid){     
        $sessionPath = $this->sessionsPath."/".$sid;

        if(!file_exists($sessionPath)) return True;
        unlink($sessionPath);
        return True;
    }
    
    // 
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

    private function _getPagePubIDByReferer(){
        $pagePubID = $_SERVER['HTTP_REFERER'];
        $pattern = '/(.+)\/(\d+)\/(.+)/i';
        $pagePubID = preg_replace($pattern, "$1/live/$3",$pagePubID);
        $pagePubID = preg_replace('/(.+)\&(.+)/', "$1",$pagePubID);
        return $pagePubID;
    }

    public function buildPage(){        
        $pagePubID = $this->_getPagePubIDByReferer();
        return Page::build($pagePubID);
    }

    public function buildProject(){        
        $pagePubID = $this->_getPagePubIDByReferer();
        $projectPubID = explode("?",$pagePubID)[0];
        return Project::build($projectPubID);
    }


    public function getProjectInfo(){
        //
        $project = $this->buildProject();
        if($project->lastError!=''){
            $this->lastError = $project->lastError;
            return False;
        }
        //      
        $info = $project->getProjectInfo();
        if(False===$info){
            $this->lastError = $project->lastError;
            return False;
        }
        //
        return $info;
    }

    public function sendEmail($email){
        $serverForumConfig = $this->serverConfig[$this->forumID];
        // Check if email configured in server config
        if(!array_key_exists("email",$serverForumConfig)) return;

        // Convert user ID list to [["email"=>,"name"=>]]
        $toEmails = $this->_sendEmail_uidsTo( $email['toUserIDs'] );        
        if(False===$toEmails) return False;

        if(count($email["to"])>0){
            // add unique emails to list 
            foreach ($email["to"] as $to) {
                $toEmail = $to["email"];
                if(
                    count(array_filter(
                        $toEmails,
                        function($item) use ($toEmail){
                            return $item['email']==$toEmail;
                        }
                    ))>0
                ) continue;
                $toEmails = array_merge($toEmails,[$to]);
            }
        }

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
        //error_log($cmd);
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


    public function getUserByEmail($email,$name){
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo) return False;
        //
        $user = $this->findUserByEmail($usersInfo,$email);
        if(False===$user){
            $uid = $usersInfo['userCounter']++;
            $user = [
                "uid"=>$uid,
                "email"=>$email,
                "name"=>$name,
            ];
            $usersInfo['list'][$uid] = $user;
            if(False===$this->saveUsersInfo($usersInfo)) return False;                    
        }
        return $user;
    }

    public function getUserByUID($uid){
        $usersInfo = $this->loadUsersInfo();
        if(False===$usersInfo) return False;
        //
        if(!array_key_exists($uid,$usersInfo['list'])) return null;
        return $usersInfo['list'][$uid];
    }

    private function findUserByEmail(&$usersInfo,$email){
        $foundUsers = array_values(array_filter(array_values($usersInfo['list']),function($u) use ($email){
            return $u['email']==$email;
        }));
        return count( $foundUsers )>0? $foundUsers[0]:False;
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
            $this->authCodesPath = $this->basePath."/auth-codes";
            $this->sessionsPath = $this->basePath."/sessions";

            $this->config = $this->loadForumConfig();
            if($this->lastError!="")return False;

            // Create new config
            if(False===$this->config){                
                $this->config = DEF_FORUM_CONFIG;
                if(False===$this->saveForumConfig()) return False;
            }
    
        }
        // Clear context
        $this->uid = "";
        $this->sid = "";
        $this->authDone = False;
        
        // ok
        Forum::$o = $this;

        // Restore user context
        {
            $uid =  http_post_param('uid');
            $sid =  http_post_param('sid');
            if(""!=$uid  && ""!=$sid){
                $checkUID = $this->_getSessionUID($sid);
                if(False===$checkUID || $checkUID!=$uid) return False;
                $user = $this->getUserByUID($uid);                
                if(False!==$user){ 
                    // Ok, user context restored
                    $this->uid = $uid;
                    $this->sid = $sid;                                 
                    $this->user = $user;
                }
            }else{
                $headers = getallheaders();
                while(True){
                    if(!array_key_exists("OIDC_userinfo_json",$headers)) break;
                    $oidcJSON = $headers['OIDC_userinfo_json'];
                    $oidc = json_decode( $oidcJSON, true );

                    $name = $oidc['name'];
                    $email = $oidc['email'];
                    if($name==="" || $email==="") break;

                    $user = $this->_findUserByODC($name,$email);
                    if(False===$user) break;
                    $uid = $user['uid'];

                    $sid = $this->_createSession($uid);
                    if(False===$sid) break;

                    $this->uid = $uid;
                    $this->sid = $sid;
                    $this->user = $user;
                    break;                    
                }
            }
        }


        return True;
    }

    private function _findUserByODC($name,$email){
        $user = $this->getUserByEmail($email,$name);
        if(False!==$user) return $user;
    }

    public function getBasePage(){
        return $this->basePath;
    }
    public function getBaseProject(){
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
            error_log($errorCode);
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
            if(!file_exists($this->basePath)){
                if(False==mkdir($this->basePath)){
                    $this->setError(ERROR_CANT_CREATE_FORUM_FOLDER);       
                    return False;
                }
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

