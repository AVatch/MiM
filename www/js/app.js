angular.module('mim', ['ionic', 'ngCordova', 'LocalStorageModule', 'timer'])

.config(['localStorageServiceProvider',function(localStorageServiceProvider) {
  localStorageServiceProvider.setPrefix('mim');
}])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.backgroundColorByName("white");
    }
  });
})


.factory('Moments', ['localStorageService', '$cordovaLocalNotification', 
         function(localStorageService, $cordovaLocalNotification){
  var getMoments = function(){
    return localStorageService.get("moments");
  };
  var addMoment = function(moment){
    var moments = getMoments();
    if(moments == null){
      moments = [];
    }

    // Assign ID
    var ids = [];
    if(moments.length==0){
      ids.push(0);
    }else{
      for(var i=0; i<moments.length; i++){
        ids.push(moments[i].momentID);
      }
    }
    var maxID = Math.max.apply(null, ids);
    moment.momentID = maxID+1;

    moment.reset = 0;
    var d = new Date();
    moment.timeCreated = d.getTime();
    moment.timeReset = d.getTime();

    moments.push(moment);

    // Assign notification
    // $cordovaLocalNotification.add({
    //   message: moment.moment,
    // }).then(function () {
    //   console.log('callback for adding background notification');
    // });


    return localStorageService.set("moments", moments);
  };
  var deleteMoment = function(moment){
    var moments = getMoments();

    for(var i=0; i<moments.length; i++){
      if(moment.momentID == moments[i].momentID){
        moments.splice(i, 1);    
      }
    }

    return localStorageService.set("moments", moments);
  };
  var reloadMoment = function(moment){
    var moments = getMoments();
    var d = new Date();

    for(var i=0; i<moments.length; i++){
      if(moment.momentID == moments[i].momentID){
        moments[i].time = d.toISOString().substr(0,d.toISOString().length-1);
        moments[i].reset += 1;
        moments[i].timeReset = d.getTime();
      }
    }

    return localStorageService.set("moments", moments);
  }

  return{
    getMoments: getMoments,
    addMoment: addMoment,
    deleteMoment: deleteMoment,
    reloadMoment: reloadMoment
  }
}])






.controller('mimController', ['$scope', '$ionicModal', '$ionicActionSheet',
            '$cordovaCamera', 'Moments',
            function($scope, $ionicModal, $ionicActionSheet, $cordovaCamera,
                     Moments){

  $scope.moments = Moments.getMoments();
  // $scope.moments = [
  //   { "momentID":0, 
  //     "moment":"Had lunch with Giullian", 
  //     "media":"http://placehold.it/50x50",
  //     "reset":5, 
  //     "color":"#F16753",
  //     "time":10000,
  //     "reminder":{"value":5, "type":"days"}
  //   },
  //   { "momentID":1, 
  //     "moment":"Read a book", 
  //     "media":"",
  //     "reset":2, 
  //     "color":"#FFDE37",
  //     "time":10000,
  //     "reminder":{"value":5, "type":"days"}
  //   },
  //   { "momentID":2, 
  //     "moment":"Worked on this app", 
  //     "media":"http://placehold.it/50x50", 
  //     "reset":1,
  //     "color":"#F16753",
  //     "time":10000,
  //     "reminder":{"value":5, "type":"days"}
  //   }

  // ];

  $scope.reload = function(moment){
    console.log("Reloading");
    console.log(moment);
    Moments.reloadMoment(moment);
    $scope.moments = Moments.getMoments();
  }
  $scope.delete = function(moment){
    Moments.deleteMoment(moment);
    $scope.moments = Moments.getMoments();
  }




  $scope.filterColor = '';
  $scope.filterByColor = function(color){
    if($scope.filterColor == color){
      $scope.filterColor = '';
    }else{
      $scope.filterColor = color;  
    }
    
  }

  $scope.sortParam = '-timeMillis';
  $scope.sortByField = function(param){
    if(param=='created'){
      if($scope.sortParam == 'timeMillis'){
        $scope.sortParam = '-timeMillis';
      }else{
        $scope.sortParam = 'timeMillis';
      }
    }else if(param=='timeReset'){
      if($scope.sortParam == param){
        $scope.sortParam = '-timeReset';
      }else{
        $scope.sortParam = 'timeReset';
      }
    }else if(param=='reset'){
      if($scope.sortParam == param){
        $scope.sortParam = '-reset';
      }else{
        $scope.sortParam = 'reset';
      }
    }
  }




  $scope.newMoment = {};
  $scope.newMoment.color = '#2C97DE';
  $scope.newMoment.ambientReminderFlag = true;
  $scope.newMoment.reminder = {};
  $scope.newMoment.reminder.timeValue = 5;
  $scope.newMoment.reminder.timeType = 'day';
  $scope.chooseNewMomentColor = function(color){
    $scope.newMoment.color = color;
  }  
  $scope.addNewMoment = function(moment){
    console.log("Adding a new moment");
    console.log(moment);

    if(moment.moment){
      Moments.addMoment(moment);

      // Cleanup
      $scope.moments = Moments.getMoments();
      $scope.closeModal();
      $scope.newMoment = {};
      $scope.newMoment.color = '#2C97DE';
      $scope.newMoment.ambientReminderFlag = true;
      $scope.newMoment.reminder = {};
      $scope.newMoment.reminder.timeValue = 5;
      $scope.newMoment.reminder.timeType = 'day';
      $scope.errorFound = false;
    }else{
      $scope.errorFound = true;
    }
  }






  // Set up the create moment modal
  $ionicModal.fromTemplateUrl('create_moment.tpl.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    // Set the current time
    var d = new Date();

    var ms = d.getTime();
    var ms_offset = d.getTimezoneOffset() * 60000;
    // var ms_corrected = ms - ms_offset;
    var ms_corrected = ms; // iPhone takes care of time zone edits

    var d_adjusted = new Date(ms_corrected);

    $scope.newMoment.timeMillis = ms;
    $scope.newMoment.time = d_adjusted.toISOString().substr(0,d.toISOString().length-8);

    console.log($scope.newMoment);

    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();    
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });


  // Set up the actionsheet
  $scope.addMedia = function() {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: 'Camera' },
        { text: 'Library' }
      ],
      titleText: 'Add Media',
      cancelText: 'Cancel',
      cancel: function() {
          // add cancel code..
      },
      buttonClicked: function(index) {
        if(index==0){
          console.log("Capturing picture");
          takePicture();
        }else if(index==1){
          console.log("Getting from library");
          importPicture();
        }

        return true;
      }
    });
  };


  // Capture image using camera
  var takePicture = function() {
    var options = { 
        quality : 75, 
        destinationType : Camera.DestinationType.DATA_URL, 
        sourceType : Camera.PictureSourceType.CAMERA, 
        allowEdit : true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 100,
        targetHeight: 100,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
      console.log("Captured the Picture");
      $scope.newMoment.media = imageData;
      $scope.$apply();
    }, function(err) {
      console.log("Error with Camera");
      console.log(err);
    });
  };

  // Capture image using library
  var importPicture = function() {
    var options = { 
        quality : 75, 
        destinationType : Camera.DestinationType.DATA_URL, 
        sourceType : Camera.PictureSourceType.PHOTOLIBRARY, 
        allowEdit : true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 100,
        targetHeight: 100,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
      console.log("Captured the Picture");
      $scope.newMoment.media = imageData;
      $scope.$apply();
    }, function(err) {
      console.log("Error with Camera");
      console.log(err);
    });
  };



}]);
