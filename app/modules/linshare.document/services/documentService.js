/**
 * @author Alpha O. Sall
 */

'use strict';

angular.module('linshare.document')
  .factory('documentUtilsService', documentService);

function documentService($translate, growlService, $log, $timeout) {
  var swalTitle, swalText, swalConfirm, swalCancel;
  $timeout(function() {
    $translate(['SWEET_ALERT.ON_FILE_DELETE.TITLE', 'SWEET_ALERT.ON_FILE_DELETE.TEXT',
      'SWEET_ALERT.ON_FILE_DELETE.CONFIRM_BUTTON', 'SWEET_ALERT.ON_FILE_DELETE.CANCEL_BUTTON'])
      .then(function(translations) {
        swalTitle = translations['SWEET_ALERT.ON_FILE_DELETE.TITLE'];
        swalText = translations['SWEET_ALERT.ON_FILE_DELETE.TEXT'];
        swalConfirm = translations['SWEET_ALERT.ON_FILE_DELETE.CONFIRM_BUTTON'];
        swalCancel = translations['SWEET_ALERT.ON_FILE_DELETE.CANCEL_BUTTON'];
      });
  },0);

  return {
    downloadFileFromResponse: downloadFileFromResponse,
    removeElementFromCollection: removeElementFromCollection,
    deleteDocuments: deleteDocuments,
    selectDocument: selectDocument
  };

  function downloadFileFromResponse(fileStream, fileName, fileType) {
    var blob = new Blob([fileStream], {type: fileType});
    var windowUrl = window.URL || window.webkitURL || window.mozURL || window.msURL;
    var urlObject = windowUrl.createObjectURL(blob);

    // create tag element a to simulate a download by click
    var a = document.createElement('a');
    a.setAttribute('href', urlObject);
    a.setAttribute('download', fileName);

    // create a click event and dispatch it on the tag element
    var event = new MouseEvent('click');
    a.dispatchEvent(event);
  }

  function removeElementFromCollection(collection, element) {
    var index = collection.indexOf(element);
    if(index > -1) {
      collection.splice(index, 1);
    }
    return collection;
  }

  function deleteDocuments(allItems, selectedItems, tableParams, items) {

    if(!angular.isArray(items)) {
      items = [items];
    }
    swal({
        title: swalTitle,
        text: swalText,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DD6B55',
        confirmButtonText: swalConfirm,
        cancelButtonText: swalCancel,
        closeOnConfirm: true,
        closeOnCancel: true
      },
      function(isConfirm) {
        if(isConfirm) {
          angular.forEach(items, function(restangularizedItem) {
            $log.debug('value to delete', restangularizedItem);
            restangularizedItem.remove().then(function() {
              growlService.notifyTopRight('GROWL_ALERT.ACTION.DELETE', 'success');
              _.remove(allItems, restangularizedItem);
              _.remove(selectedItems, restangularizedItem);
              //documentsListCopy = allItems; // I keep a copy of the data for the filter module
              tableParams.reload();
            });
          });
        }
      }
    );
  }

  function selectDocument(selectedDocuments, document) {
    document.isSelected = !document.isSelected;
    if(document.isSelected) {
      selectedDocuments.push(document);
    } else {
      var indexMulSelect = selectedDocuments.indexOf(document);
      if(indexMulSelect > -1) {
        selectedDocuments.splice(indexMulSelect, 1);
      }
    }
  }
}
