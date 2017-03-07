(function() {
  'use strict';

  angular
    .module('linshare.sharedSpace')
    .controller('SharedSpaceListController', sharedSpaceListController);

  function sharedSpaceListController($scope, $log, currentWorkGroup, NgTableParams, $filter, documentUtilsService, growlService, workgroupMembersRestService, workgroupEntriesRestService, workgroupFoldersRestService, $state, $stateParams, Restangular, $translatePartialLoader, $timeout, $translate, sharedSpaceBreadcrumbService, flowUploadService, lsAppConfig, $q) {
    /* jshint validthis:true */
    var sharedSpaceListVm = this;

    var setFileToEditable = setFileToEditableFunction;
    var setFolderToEditable = setFolderToEditableFunction;
    var swalNewFolderName;
    var swalMultipleDownloadTitle, swalMultipleDownloadText, swalMultipleDownloadConfirm;
    var openSearch = openSearchFunction;
    var closeSearch = closeSearchFunction;

    $scope.reloadDocuments = reloadDocuments;

    // TODO : work around to disable folders, with this user never see root folder, he is directly inside it, remove these 2 lines after RC
    $stateParams.folderName = $stateParams.workgroupName;
    $stateParams.parent = $stateParams.uuid;

    sharedSpaceListVm.addSelectedDocument = addSelectedDocument;
    sharedSpaceListVm.addUploadedEntry = addUploadedEntry;
    sharedSpaceListVm.copy = copy;
    sharedSpaceListVm.createFolder = createFolder;
    sharedSpaceListVm.currentPage = 'group_list_files';
    sharedSpaceListVm.currentSelectedDocument = {};
    sharedSpaceListVm.deleteDocuments = deleteDocuments;
    sharedSpaceListVm.downloadFile = downloadFile;
    sharedSpaceListVm.flagsOnSelectedPages = {};
    sharedSpaceListVm.flowUploadService = flowUploadService;
    sharedSpaceListVm.folderDetails = $stateParams;
    sharedSpaceListVm.folderName = $stateParams.folderName;
    sharedSpaceListVm.folderUuid = $stateParams.folderUuid;
    sharedSpaceListVm.getDetails = getDetails;
    sharedSpaceListVm.goToSharedSpaceFolderTarget = goToSharedSpaceFolderTarget;
    sharedSpaceListVm.itemsList = currentWorkGroup;
    sharedSpaceListVm.itemsListCopy = sharedSpaceListVm.itemsList;
    sharedSpaceListVm.loadSidebarContent = loadSidebarContent;
    sharedSpaceListVm.name = $stateParams.workgroupName;
    sharedSpaceListVm.paramFilter = {name: ''};
    sharedSpaceListVm.parent = $stateParams.parent;
    sharedSpaceListVm.renameItem = renameItem;
    sharedSpaceListVm.renameFolder = renameFolder;
    sharedSpaceListVm.resetSelectedDocuments = resetSelectedDocuments;
    sharedSpaceListVm.selectDocumentsOnCurrentPage = selectDocumentsOnCurrentPage;
    sharedSpaceListVm.selectedDocuments = [];
    sharedSpaceListVm.setTextInput = setTextInput;
    sharedSpaceListVm.showItemDetails = showItemDetails;
    sharedSpaceListVm.slideTextarea = slideTextarea;
    sharedSpaceListVm.slideUpTextarea = slideUpTextarea;
    sharedSpaceListVm.sortDropdownSetActive = sortDropdownSetActive;
    sharedSpaceListVm.toggleFilterBySelectedFiles = toggleFilterBySelectedFiles;
    sharedSpaceListVm.toggleSearchState = toggleSearchState;
    sharedSpaceListVm.unavailableMultiDownload = unavailableMultiDownload;
    sharedSpaceListVm.uuid = $stateParams.uuid;
    sharedSpaceListVm.workgroupPage = lsAppConfig.workgroupPage;
    sharedSpaceListVm.workgroupDetailFile = lsAppConfig.workgroupDetailFile;

    activate();

    ////////////////

    function activate() {
      workgroupMembersRestService.get(sharedSpaceListVm.uuid, $scope.userLogged.uuid).then(function(member) {
        sharedSpaceListVm.currentWorkgroupMember = member;
      });

      $scope.$on('$stateChangeSuccess', function() {
        angular.element('.multi-select-mobile').appendTo('body');
      });

      sharedSpaceListVm.fab = {
        isOpen: false,
        count: 0,
        selectedDirection: 'left'
      };
      $scope.$watch('fab.isOpen', function(isOpen) {
        if (isOpen) {
          angular.element('.md-toolbar-tools').addClass('setWhite');
          angular.element('.multi-select-mobile').addClass('setDisabled');
          angular.element('#overlayMobileFab').addClass('double-row-fab');
          $timeout(function() {
            angular.element('#overlayMobileFab').addClass('toggledMobileShowOverlay');
            angular.element('#content-container').addClass('setDisabled');
          }, 250);
        } else {
          angular.element('.md-toolbar-tools').removeClass('setWhite');
          $timeout(function() {
            angular.element('.multi-select-mobile').removeClass('setDisabled');
            angular.element('#overlayMobileFab').removeClass('toggledMobileShowOverlay');
            angular.element('#content-container').removeClass('setDisabled');
            angular.element('#overlayMobileFab').removeClass('double-row-fab');
          }, 250);
        }
      });

      $translate(['ACTION.NEW_FOLDER'])
        .then(function(translations) {
          swalNewFolderName = translations['ACTION.NEW_FOLDER'];
        });
      $translate(['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TITLE',
        'SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TEXT',
        'SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.CONFIRM_BUTTON'])
        .then(function(translations) {
          swalMultipleDownloadTitle = translations['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TITLE'];
          swalMultipleDownloadText = translations['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.TEXT'];
          swalMultipleDownloadConfirm = translations['SWEET_ALERT.ON_MULTIPLE_DOWNLOAD.CONFIRM_BUTTON'];
        });

      $translatePartialLoader.addPart('filesList');
      $translatePartialLoader.addPart('sharedspace');

      pushEntriesAndBreadcrumb();
    }

    function addSelectedDocument(document) {
      documentUtilsService.selectDocument(sharedSpaceListVm.selectedDocuments, document);
    }

    function addUploadedEntry(flowFile) {
      if (flowFile._from === $scope.workgroupPage) {
        if (flowFile.folderDetails.uuid === sharedSpaceListVm.folderDetails.uuid &&
          flowFile.folderDetails.folderUuid === sharedSpaceListVm.folderDetails.folderUuid) {
          flowFile.asyncUploadDeferred.promise.then(function(file) {
            sharedSpaceListVm.itemsList.push(file.linshareDocument);
            $scope.isNewAddition = true;
            sharedSpaceListVm.tableParams.reload();
            $timeout(function() {
              $scope.isNewAddition = false;
            }, 0);
          });
        }
      }
    }

    function closeSearchFunction() {
      angular.element('#drop-area').removeClass('search-toggled');
      angular.element('#searchInMobileFiles').val('').trigger('change');
    }

    function copy(entryUuid) {
      workgroupEntriesRestService.copy(sharedSpaceListVm.uuid, entryUuid).then(function() {
        growlService.notifyTopRight('GROWL_ALERT.ACTION.COPY', 'inverse');
      });
    }

    function createFolder() {
      var defaultNamePos = newFolderNumber(sharedSpaceListVm.itemsList);
      var defaultName = defaultNamePos !== 0 ? swalNewFolderName + ' (' + defaultNamePos + ')' : swalNewFolderName;
      createFolderFunction(defaultName);
    }

    function createFolderFunction(folderName) {
      var folder = {
        name: folderName.trim(),
        uuid: Math.random().toString(36).substring(7),
        parent: sharedSpaceListVm.folderUuid
      };
      sharedSpaceListVm.itemsList.push(folder);
      sharedSpaceListVm.tableParams.reload();
      $timeout(function() {
        renameFolder(folder, true);
      }, 0);
    }

    function deleteCallback(items) {
      angular.forEach(items, function(restangularizedItem) {
        _.remove(restangularizedItem.lastAuthor);
        restangularizedItem.remove().then(function() {
          growlService.notifyTopRight('GROWL_ALERT.ACTION.DELETE', 'success');
          _.remove(sharedSpaceListVm.itemsList, restangularizedItem);
          _.remove(sharedSpaceListVm.selectedDocuments, restangularizedItem);
          sharedSpaceListVm.itemsListCopy = sharedSpaceListVm.itemsList; // I keep a copy of the data for the filter module
          sharedSpaceListVm.tableParams.reload();
        }, function(error) {
          if (error.status === 400 && error.data.errCode === 26006) {
            growlService.notifyTopRight('GROWL_ALERT.ERROR.DELETE_ERROR.26006', 'danger');
          }
        });
      });
    }

    function deleteDocuments(items) {
      documentUtilsService.deleteDocuments(items, deleteCallback);
    }

    /**
     *  @name downloadFile
     *  @desc Download a file of a document for the user
     *  @param {Object) documentFile - A document object
     *  @memberOf LinShare.sharedSpace.SharedSpaceListController
     */
    function downloadFile(documentFile) {
      workgroupEntriesRestService.download(sharedSpaceListVm.uuid, documentFile.uuid).then(function(fileStream) {
        documentUtilsService.downloadFileFromResponse(fileStream, documentFile.name, documentFile.type);
      });
    }

    function folderNotExits(items, newName, newFolder) {
      var notExists = true;
      var itemsList = _.clone(items);
      if (newFolder) {
        itemsList.pop();
      }
      _.forEach(itemsList, function(item) {
        if (!item.type && item.name.toLowerCase() === newName.toLowerCase()) {
          notExists = false;
        }
      });
      return notExists;
    }

    function getDetails(item) {
      var
        deferred = $q.defer(),
        details = {},
        service = item.workGroup ? workgroupFoldersRestService : workgroupEntriesRestService;

      service.get(sharedSpaceListVm.uuid, item.uuid).then(function(data) {
        details = data;
        if (data.hasThumbnail) {
          service.thumbnail(sharedSpaceListVm.uuid, item.uuid).then(function(thumbnail) {
            details.thumbnail = thumbnail;
          });
        } else {
          delete details.thumbnail;
        }
        deferred.resolve(details);
      }, function(error) {
        deferred.reject(error);
      });

      return deferred.promise;
    }

    function goToSharedSpaceFolderTarget(uuid, name, parent, folderUuid, folderName, fromBreacrumb, needReplace) {
      var folderNameElem = $('td[uuid=' + folderUuid + ']').find('.file-name-disp');
      var options = needReplace ? {location: 'replace'} : {};
      if (angular.element(folderNameElem).attr('contenteditable') === 'false' || fromBreacrumb) {
        $state.go('sharedspace.workgroups.entries', {
          uuid: uuid,
          workgroupName: name.trim(),
          parent: parent,
          folderUuid: folderUuid,
          folderName: folderName.trim()
        }, options);
      }
    }

    function loadSelectedDocument(filteredData) {
      var documentToSelect = _.find(filteredData, {'uuid': $stateParams.uploadedFileUuid});
      if (!_.isUndefined(documentToSelect)) {
        addSelectedDocument(documentToSelect);
      }
    }

    /**
     * @name loadSidebarContent
     * @desc Update the content of the sidebar
     * @param {String} cotent The id of the content to load, see app/views/includes/sidebar-right.html for possible values
     */
    function loadSidebarContent(content) {
      $scope.mainVm.sidebar.setData(sharedSpaceListVm);
      $scope.mainVm.sidebar.setContent(content);
      $scope.mainVm.sidebar.show();
    }

    function loadSpecificPage() {
      var items = _.orderBy(sharedSpaceListVm.itemsList.plain(), 'modificationDate', ['desc']);
      if ($stateParams.uploadedFileUuid) {
        return Math.floor(_.findIndex(items, {'uuid': $stateParams.uploadedFileUuid}) / 10) + 1;
      }
      return 1;
    }

    function loadTable() {
      return $q(function(resolve) {
        resolve(
          new NgTableParams({
            page: loadSpecificPage(),
            sorting: {modificationDate: 'desc'},
            count: 10,
            filter: sharedSpaceListVm.paramFilter
          }, {
            getData: function(params) {
              var filteredData = params.filter() ? $filter('filter')(sharedSpaceListVm.itemsList, params.filter()) : sharedSpaceListVm.itemsList;
              var filesList = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : filteredData;
              params.total(filesList.length);
              params.settings({counts: filteredData.length > 10 ? [10, 25, 50, 100] : []});
              if ($stateParams.uploadedFileUuid) {
                loadSelectedDocument(filteredData);
              }
              return (filesList.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
          })
        );
      });
    }

    function newFolderNumber(items) {
      var foldersName = [];
      _.forEach(items, function(item) {
        if (!item.type) {
          foldersName.push(item.name);
        }
      });
      if (foldersName.length === 0 || !_.includes(foldersName, swalNewFolderName)) {
        return 0;
      } else {
        var iteration = 1;
        var foldersIndex = [];
        var regex = new RegExp('^' + swalNewFolderName + ' \\([0-9]+\\)');
        _.forEach(items, function(item) {
          if (!item.type && regex.test(item.name)) {
            foldersIndex.push(parseInt(item.name.replace(/\D/g, '')));
          }
        });
        foldersIndex = _.sortBy(foldersIndex, function(val) {
          return val;
        });
        _.forEach(foldersIndex, function(index, key) {
          if (index === key + 1) {
            iteration++;
          } else {
            return iteration;
          }
        });
        return iteration;
      }
    }

    function openSearchFunction() {
      angular.element('#drop-area').addClass('search-toggled');
      angular.element('#top-search-wrap input').focus();
    }

    function pushEntriesAndBreadcrumb() {
      // TODO : workaround to disable folders, with this user never see root folder, he is directly inside it, remove first if after RC
      if(currentWorkGroup.plain().length > 0) {
        _.forEach(currentWorkGroup[0].entries, function(entry) {
          Restangular.restangularizeElement(currentWorkGroup, entry, 'entries/' + entry.uuid);
          entry.parentResource.route = '';
          sharedSpaceListVm.itemsList.push(entry);
        });

        _.remove(sharedSpaceListVm.itemsList, {route: 'folders'});
        loadTable().then(function(data) {
          sharedSpaceListVm.tableParams = data;
        });
      } else {
        if (sharedSpaceListVm.folderUuid !== sharedSpaceListVm.uuid) {
          workgroupFoldersRestService.get(sharedSpaceListVm.uuid, sharedSpaceListVm.folderUuid).then(function(folder) {
            var currentWorkGroupEntries = _.clone(currentWorkGroup);
            currentWorkGroupEntries.route = 'entries';
            sharedSpaceBreadcrumbService.build(sharedSpaceListVm.uuid, folder.ancestors).then(function(breadcrumb) {
              sharedSpaceListVm.breadcrumbFolders = breadcrumb;
            });

          _.forEach(folder.entries, function(entry) {
            Restangular.restangularizeElement(currentWorkGroup, entry, 'entries/' + entry.uuid);
            entry.parentResource.route = '';
            sharedSpaceListVm.itemsList.push(entry);
          });

            loadTable().then(function(data) {
              sharedSpaceListVm.tableParams = data;
            });
          }, 0);
        } else {
          loadTable().then(function(data) {
            sharedSpaceListVm.tableParams = data;
          });
        }
      }
    }

    function reloadDocuments() {
      $timeout(function() {
        if (sharedSpaceListVm.folderUuid === sharedSpaceListVm.uuid) {
          workgroupFoldersRestService.getParent(sharedSpaceListVm.uuid, sharedSpaceListVm.uuid).then(function(folder) {
            sharedSpaceListVm.goToSharedSpaceFolderTarget(sharedSpaceListVm.uuid, sharedSpaceListVm.name, folder[0].parent, folder[0].uuid, folder[0].name, true, true);
          }, 0);
        } else {
          workgroupFoldersRestService.getParent(sharedSpaceListVm.uuid, sharedSpaceListVm.folderUuid).then(function(data) {
            sharedSpaceListVm.itemsList = data;
            sharedSpaceListVm.itemsListCopy = data;
            $scope.isNewAddition = true;
            pushEntriesAndBreadcrumb();
            sharedSpaceListVm.tableParams.reload();
            $timeout(function() {
              $scope.isNewAddition = false;
            }, 0);
          }, 0);
        }
      });
    }

    function renameFolder(folder, newFolder) {
      var folderNameElem = $('td[uuid=' + folder.uuid + ']').find('.file-name-disp');
      setFolderToEditable(folderNameElem, folder, newFolder);
    }

    function renameItem(item) {
      var itemNameElem = $('td[uuid=' + item.uuid + ']').find('.file-name-disp');
      setFileToEditable(itemNameElem, item);
    }

    function resetSelectedDocuments() {
      delete sharedSpaceListVm.tableParams.filter().isSelected;
      documentUtilsService.resetItemSelection(sharedSpaceListVm.selectedDocuments);
    }

    function saveNewFolder(folder) {
      workgroupFoldersRestService.create(sharedSpaceListVm.uuid, folder).then(function(data) {
        sharedSpaceListVm.itemsList.pop();
        sharedSpaceListVm.itemsList.push(data);
        sharedSpaceListVm.tableParams.reload();
        return false;
      });
    }

    function selectDocumentsOnCurrentPage(data, page, selectFlag) {
      var currentPage = page || sharedSpaceListVm.tableParams.page();
      var dataOnPage = data || sharedSpaceListVm.tableParams.data;
      var select = selectFlag || sharedSpaceListVm.flagsOnSelectedPages[currentPage];
      if (!select) {
        _.forEach(dataOnPage, function(element) {
          if (!element.isSelected) {
            element.isSelected = true;
            sharedSpaceListVm.selectedDocuments.push(element);
          }
        });
        sharedSpaceListVm.flagsOnSelectedPages[currentPage] = true;
      } else {
        sharedSpaceListVm.selectedDocuments = _.xor(sharedSpaceListVm.selectedDocuments, dataOnPage);
        angular.forEach(dataOnPage, function(element) {
          if (element.isSelected) {
            element.isSelected = false;
            _.remove(sharedSpaceListVm.selectedDocuments, function(n) {
              return n.uuid === element.uuid;
            });
          }
        });
        sharedSpaceListVm.flagsOnSelectedPages[currentPage] = false;
      }
    }

    function setFileToEditableFunction(idElem, data) {
      var initialName = idElem[0].textContent;
      var fileExtension = data.name.substr(initialName.lastIndexOf('.'));
      angular.element(idElem).attr('contenteditable', 'true')
        .on('focus', function() {
          document.execCommand('selectAll', false, null);
          initialName = idElem[0].textContent;
        })
        .on('focusout', function() {
          data.name = idElem[0].textContent;
          if (data.name.trim() === '') {
            // if the new name is empty then replace with by previous once
            angular.element(idElem).text(initialName);
            data.name = initialName;
            updateNewName(data, idElem);
          } else {
            if (data.name.indexOf('.') === -1) {
              // if the new name does not contain a file name extension then add the previous original extension to it
              data.name = data.name + fileExtension;
              angular.element(idElem).text(data.name);
              updateNewName(data, idElem);
            } else {
              updateNewName(data, idElem);
            }
          }
        })
        .on('keypress', function(e) {
          if (e.which === 13) {
            angular.element(idElem).focusout();
          }
        });
      angular.element(idElem).focus();
    }

    function setFolderToEditableFunction(idElem, data, newFolder) {
      var initialName = swalNewFolderName;
      angular.element(idElem).attr('contenteditable', 'true')
        .on('focus', function() {
          document.execCommand('selectAll', false, null);
          initialName = data.name;
        })
        .on('focusout', function() {
          if (newFolder || data.name !== idElem[0].textContent) {
            if (folderNotExits(sharedSpaceListVm.itemsList, idElem[0].textContent.trim(), newFolder)) {
              data.name = idElem[0].textContent.trim();
              if (data.name.trim() === '') {
                angular.element(idElem).text(initialName);
                data.name = initialName.trim();
              }
              if (newFolder) {
                saveNewFolder(data);
              } else {
                workgroupFoldersRestService.update(sharedSpaceListVm.uuid, data);
              }
              angular.element(this).attr('contenteditable', 'false');
            } else {
              $log('Folder name exists');
              data.name = initialName;
              if (newFolder) {
                saveNewFolder(data);
              }
              growlService.notifyTopRight('GROWL_ALERT.ERROR.RENAME_FOLDER', 'danger');
              angular.element(idElem).text(initialName);
              angular.element(this).attr('contenteditable', 'false');
              angular.element(this).blur();
            }
          }
        })
        .on('keypress', function(e) {
          if (e.which === 13) {
            if (newFolder || data.name !== idElem[0].textContent) {
              if (folderNotExits(sharedSpaceListVm.itemsList, idElem[0].textContent.trim(), newFolder)) {
                data.name = idElem[0].textContent.trim();
                if ((data.name.trim() === initialName) || (data.name.trim() === '')) {
                  angular.element(idElem).text(initialName);
                  data.name = initialName.trim();
                }
                if (newFolder) {
                  saveNewFolder(data);
                } else {
                  if (data.name !== initialName) {
                    workgroupFoldersRestService.update(sharedSpaceListVm.uuid, data);
                  }
                }
                angular.element(this).attr('contenteditable', 'false');
              } else {
                $log('Folder name exists');
                data.name = initialName;
                if (newFolder) {
                  saveNewFolder(data);
                }
                growlService.notifyTopRight('GROWL_ALERT.ERROR.RENAME_FOLDER', 'danger');
                angular.element(idElem).text(initialName);
                angular.element(this).attr('contenteditable', 'false');
              }
            }
            return false;
          }
        });
      angular.element(idElem).focus();
    }

    function setTextInput($event) {
      var currTarget = $event.currentTarget;
      var inputTxt = angular.element(currTarget).text();
      if (inputTxt === '') {
        angular.element(currTarget).parent().find('span').css('display', 'block');
      } else {
        angular.element(currTarget).parent().find('span').css('display', 'none');
      }
    }

    function showItemDetails(current, event) {
      workgroupEntriesRestService.get(sharedSpaceListVm.uuid, current.uuid).then(function(data) {
        sharedSpaceListVm.currentSelectedDocument.current = data;
      });
      $scope.loadSidebarContent(sharedSpaceListVm.workgroupDetailFile);
      var currElm = event.currentTarget;
      angular.element('#file-list-table tr li').removeClass('activeActionButton').promise().done(function() {
        angular.element(currElm).addClass('activeActionButton');
      });
    }

    function slideTextarea($event) {
      var currTarget = $event.currentTarget;
      angular.element(currTarget).parent().addClass('show-full-comment');
    }

    function slideUpTextarea($event) {
      var currTarget = $event.currentTarget;
      angular.element(currTarget).parent().removeClass('show-full-comment');
    }

    function sortDropdownSetActive(sortField, $event) {
      sharedSpaceListVm.toggleSelectedSort = !sharedSpaceListVm.toggleSelectedSort;
      sharedSpaceListVm.tableParams.sorting(sortField, sharedSpaceListVm.toggleSelectedSort ? 'desc' : 'asc');
      var currTarget = $event.currentTarget;
      angular.element('.labeled-dropdown.open a').removeClass('selected-sorting').promise().done(function() {
        angular.element(currTarget).addClass('selected-sorting');
      });
    }

    function toggleFilterBySelectedFiles() {
      if (sharedSpaceListVm.tableParams.filter().isSelected) {
        delete sharedSpaceListVm.tableParams.filter().isSelected;
      } else {
        sharedSpaceListVm.tableParams.filter().isSelected = true;
      }
    }

    function toggleSearchState() {
      if (!sharedSpaceListVm.searchMobileDropdown) {
        openSearch();
      } else {
        closeSearch();
      }
      sharedSpaceListVm.searchMobileDropdown = !sharedSpaceListVm.searchMobileDropdown;
    }

    function unavailableMultiDownload() {
      swal({
          title: swalMultipleDownloadTitle,
          text: swalMultipleDownloadText,
          type: 'error',
          confirmButtonColor: '#05b1ff',
          confirmButtonText: swalMultipleDownloadConfirm,
          closeOnConfirm: true
        }
      );
    }

    function updateNewName(data, elem) {
      delete data.lastAuthor;
      workgroupEntriesRestService.update(sharedSpaceListVm.uuid, data.uuid, data);
      angular.element(elem).attr('contenteditable', 'false');
    }
  }
})();
