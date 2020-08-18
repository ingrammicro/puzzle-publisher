/*
The MIT License (MIT)

Copyright (c) 2017 RealtimeBoard Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var ErrorReasons = {
  userBlocked: "userBlocked",
  authorizationFailed: "authorizationFailed",
  suspiciousActivity: "suspiciousActivity",
  termsViolation: "termsViolation",
  userDeleted: "userDeleted",
  userLockout: "userLockout"
};

var ErrorMessages = {
  suspiciousActivity: 'Your account is locked due to suspicious activity.',
  termsViolation: 'Your account is locked due to a Terms of Use violation.',
  userDeleted: 'Your account is currently being deleted.',
  userDeletedDesc: 'Until then, you cannot log in or create an account with this email.',
  userLockout: 'Your account is locked due to multiple failed login attempts for 60 minutes. To unlock your account please wait or visit https://realtimeboard.com/email-unlock/',
  contactUs: 'Please contact our support team at support@realtimeboard.com for further assistance.',
  passwordIncorrect: 'The username or password you entered is incorrect.',
  defaultLockout: 'Your account is locked.'
};

function getMessagesByError(error) {
  var messages = {
    label: nil,
    alert: nil
  }

  if (error.code == 403) {
    var messageEnd = "";

    if (error.reason == ErrorReasons.suspiciousActivity || error.reason == ErrorReasons.termsViolation) {
      messageEnd = ErrorMessages.contactUs;
    } else if (error.reason == ErrorReasons.userDeleted) {
      messageEnd = ErrorMessages.userDeletedDesc;
    } else if (error.reason == ErrorReasons.userLockout) {
      messageEnd = ErrorMessages.userLockout;
    }

    if (error.reason == ErrorReasons.userLockout) {
      messages.label = ErrorMessages.defaultLockout;
      messages.alert = ErrorMessages[error.reason];
    } else {
      messages.label = ErrorMessages[error.reason];
      messages.alert = ErrorMessages[error.reason] + " " + messageEnd;
    }
  } else {
    messages.label = ErrorMessages.passwordIncorrect;
  }

  return messages;
}

function makeSubclass(className, BaseClass, selectorHandlerDict) {
  var uniqueClassName = className + NSUUID.UUID().UUIDString();
  var delegateClassDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, BaseClass);

  for (var selectorString in selectorHandlerDict) {
    delegateClassDesc.addInstanceMethodWithSelector_function_(selectorString, selectorHandlerDict[selectorString]);
  }

  delegateClassDesc.registerClass();

  return NSClassFromString(uniqueClassName);
}

function logMsg(msg) {
  log('[sketch-rtb]: ' + msg)
}

function logErr(err) {
  log('[sketch-rtb-error]: ' + err)
}
