import template from './viewReports.component.html';

function viewReportsComponentController(nxpHttpService, fisI18nService, $scope, fisViewPanelService, zenoAgGridService, reportingQueryDataService, $timeout, $window) {

    let $ctrl = this;
    $ctrl.subTitle = 'Reports List';
    $ctrl.i18n = fisI18nService.translate;
    $ctrl.listData = [];
    $ctrl.pageActions = [];
    $ctrl.showList = false;

    const activeViewPanel = fisViewPanelService.activeViewPanel();
    const params = angular.extend({}, activeViewPanel.params, activeViewPanel.args);
    $ctrl.paramsCat = params.category;

    if($ctrl.paramsCat === $ctrl.i18n('reporting.clientReports.tradeClearing')){
        $ctrl.title = 'Clearing Reports';
    }else if($ctrl.paramsCat === $ctrl.i18n('reporting.clientReports.backOffcReports')){
        $ctrl.title = 'Back Office Reports';
    }else if($ctrl.paramsCat === $ctrl.i18n('reporting.regulatoryReports.args')){
        $ctrl.title = 'Regulatory Reports';
    }else if($ctrl.paramsCat === $ctrl.i18n('reporting.customReports.reportCat')){
        $ctrl.title = 'Custom Reports';
    }

    loadData();
    
    function loadData() {
        return nxpHttpService({
            url: '../api/reporting/config/templates',
            method: 'GET'
        }).then((response) => {
            $ctrl.reports = response.data;
            const resultList = [];
            if($ctrl.paramsCat === $ctrl.i18n('reporting.clientReports.tradeClearing')){
                $ctrl.reports.forEach(element => {
                    if(element.tag !== null){
                        var tags = element.tag.split(',');
                        for(var k in tags){  
                            if(tags[k].trim() === $ctrl.i18n('reporting.clientReports.tradeClearingTag')){
                                resultList.push({
                                    label: element.reportName, reportTemplateId: element.id, tag: element.tag, category: element.type, authority: element.authority, fields: element.muParamSetList
                                })
                            }
                        }
                    }
                });
                $ctrl.listData = resultList;
            }else if($ctrl.paramsCat === $ctrl.i18n('reporting.clientReports.backOffcReports')){
                $ctrl.reports.forEach(element => {
                    if(element.tag !== null){
                        var tags = element.tag.split(',');
                        for(var k in tags){  
                            if(tags[k].trim() === $ctrl.i18n('reporting.clientReports.isBOTag')){
                                resultList.push({
                                    label: element.reportName, reportTemplateId: element.id, tag: element.tag, category: element.type, authority: element.authority, fields: element.muParamSetList
                                })
                            }
                        }
                    }
                });
                $ctrl.listData = resultList;
            }else if($ctrl.paramsCat === $ctrl.i18n('reporting.regulatoryReports.args')){
                $ctrl.reports.forEach(element => {
                    if(element.type === $ctrl.i18n('reporting.regulatoryReports.reportCatReg')){
                        resultList.push({
                            label: element.reportName, reportTemplateId: element.id, tag: element.tag, category: element.type, authority: element.authority, fields: element.muParamSetList
                        })
                    }
                });
                $ctrl.listData = resultList;
            }else if($ctrl.paramsCat === $ctrl.i18n('reporting.customReports.reportCat')){
                $ctrl.reports.forEach(element => {
                    if(element.type === $ctrl.i18n('reporting.customReports.reportCat')){
                        resultList.push({
                            label: element.reportName, reportTemplateId: element.id, tag: element.tag, category: element.type, authority: element.authority, fields: element.muParamSetList
                        });
                    }
                });
                $ctrl.listData = resultList;
            }
        });
    }

    let columnDefs = [
        { headerName: $ctrl.i18n('reporting.config.reportName'), field: 'reportName' , suppressMenu: true, sortable: false},
        { headerName: $ctrl.i18n('reporting.config.businessDate'), field: 'businessDate' , type: 'date', suppressMenu: true},
        { headerName: $ctrl.i18n('reporting.config.reportDate'), field: 'creation', type: 'datetime', suppressMenu: true},
        { headerName: $ctrl.i18n('reporting.config.fileName'), field: 'name' , suppressMenu: true},
        { headerName: $ctrl.i18n('reporting.config.format'), field: 'format' , suppressMenu: true, sortable: false}
    ];

    $ctrl.gridOptions = zenoAgGridService.api.initGrid({
        defaultColDef: {
            sortable: true
        },
        columnDefs: columnDefs,
        zgOptionsBase: 'nxpDefault',
        rowSelection: 'single',
        angularCompileRows: true,
        enableColResize: true,
        suppressHorizontalScroll: true,
        rowModelType: 'infinite',
        cacheBlockSize: 20,
        suppressPaginationPanel: true,
        maxBlocksInCache: 150,
        onRowClicked: function (selectedRow) {
            $ctrl.pageActions.length = 0;
            onRowClickedGrid(selectedRow.data);
        }
    });

    function sortBy(){
        var sort = [
            {colId: 'reportName', sort: 'desc'},
            {colId: 'businessDate', sort: 'desc'},
            {colId: 'creation', sort: 'desc'},
            {colId: 'name', sort: 'desc'},
            {colId: 'format', sort: 'desc'}
        ];
        $ctrl.gridOptions.apiPromise.setSortModel(sort);
    }

    $ctrl.businessDateChanged = function(value){
        $ctrl.date = value;
        loadDataRecipient();
    }

    $ctrl.filterReportSelChanged = function(value){
        if(value !== null){
            $ctrl.reportTemplateId = value.reportTemplateId;     
        }else if(value === null){
            $ctrl.reportTemplateId = undefined;
        }   
        loadDataRecipient();
    }

    loadDataRecipient();

    $ctrl.reloadData = () => {
        return loadDataRecipient();
    };
    
    function loadDataRecipient() {
        
        if($ctrl.paramsCat === $ctrl.i18n('reporting.clientReports.tradeClearing')){
            $ctrl.templateType = $ctrl.i18n('reporting.clientReports.reportCatClient');
            $ctrl.templateTag = $ctrl.i18n('reporting.clientReports.tradeClearingTag');
        } else if($ctrl.paramsCat === $ctrl.i18n('reporting.clientReports.backOffcReports')){
            $ctrl.templateType = $ctrl.i18n('reporting.clientReports.reportCatClient');
            $ctrl.templateTag = $ctrl.i18n('reporting.clientReports.isBOTag');
        }else if($ctrl.paramsCat === $ctrl.i18n('reporting.regulatoryReports.args')){
            $ctrl.templateType = $ctrl.i18n('reporting.regulatoryReports.reportCatReg');
        }else if($ctrl.paramsCat === $ctrl.i18n('reporting.customReports.reportCat')){
            $ctrl.templateType = $ctrl.i18n('reporting.customReports.reportCat');
        }

        return $ctrl.gridOptions.apiPromise.whenReady().then(() => {
            sortBy();
            if ($ctrl.gridOptions.rowModelType === 'infinite') {
                const dataSource = {
                    getRows: async (params) => {   
                        $ctrl.gridOptions.api.showLoadingOverlay();
                        $ctrl.offset = params.startRow;
                        $ctrl.limit = params.endRow - params.startRow;
                        $ctrl.sortFilters = $ctrl.gridOptions.api.getSortModel();

                        let response = await reportingQueryDataService.getBusDtTimeClientReports($ctrl);
                        $ctrl.gridOptions.api.hideOverlay();

                        if(response.data.total === 0){
                            $ctrl.gridOptions.api.showNoRowsOverlay();
                        }
                        else{
                            let responseData = response.data;
                            for(var i=0; i< responseData.data.length ; i++){
                                responseData.data[i].creation = moment(responseData.data[i].creation).format();
                                responseData.data[i].businessDate = moment(responseData.data[i].businessDate).format('MM/DD/YYYY');
                            }
                        }  
                        params.successCallback(response.data.data, response.data.total);
                                       
                        $ctrl.gridOptions.api.sizeColumnsToFit();
                    }             
                }
                $ctrl.gridOptions.api.setDatasource(dataSource);
            }
        }).catch(function (reason) {
            $log.error(reason);
        });
    }

    function onRowClickedGrid(data) {
        $ctrl.getSelectedRow(data);
    }

    $ctrl.getSelectedRow = function (selectedRow) {
        var D = document;
        var downloadButton = D.createElement('button');

        $scope.$apply(function () {
            if ($ctrl.pageActions.length === 0) {
                $ctrl.pageActions.push({
                    id: 'view',
                    label: $ctrl.i18n('reporting.buttons.view', 'View'),
                    action: function () {
                        $ctrl.templateIdView = selectedRow.id;
                        location = '../api/reporting/report/'+ $ctrl.templateIdView;
                        downloadButton.onclick = function(){
                            $window.location = location;
                        };
                        downloadButton.style.display = 'none';
                        D.body.appendChild(downloadButton);
                        $timeout(function() {
                            if (downloadButton.click) {
                                downloadButton.click();
                            }
                            D.body.removeChild(downloadButton);
                        }, 100);
                    }               
                });
            }
        })
    
    }

}

export default {
    template,
    bindings: {
        // add bindings here
    },
    controller: ['nxpHttpService', 'fisI18nService', '$scope', 'fisViewPanelService', 'zenoAgGridService', 'reportingQueryDataService', '$timeout', '$window', viewReportsComponentController],

}
