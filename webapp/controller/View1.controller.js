sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/Fragment'
],
    function (Controller, Device, JSONModel,Fragment) {
        "use strict";
        var that;
        return Controller.extend("quotationinterface.controller.View1", {
            onInit: function () {
                that = this;
                if (!that.create) {

                    that.create = sap.ui.xmlfragment("quotationinterface.view.create", that);
                }
               
      
                var oVizFrame = this.oVizFrame = this.getView().byId("_IDGenVizFrame1");
                const socket = new WebSocket("wss://060a0275trial-dev-quotation-capm-srv.cfapps.us10-001.hana.ondemand.com");

                socket.onopen = function () {
                    console.log("WebSocket connection established");
                };

                socket.onmessage = function (event) {
                    const data = JSON.parse(event.data);

                    // Handle the createQuotation event
                    if (data.action === 'ApproveQuotation') {
                        this._setIceCreamModel()
                        that._SetHeaderData()
                        that.onRefresh()
                        that.formatStatusColor()
                    }

                }.bind(this);


                this._setIceCreamModel()
                that._SetHeaderData()
                that.onRefresh()
                var oPopOver = this.getView().byId("idPopOver");
                oPopOver.connect(oVizFrame.getVizUid());
                // oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
            },
            onDevide:function(oEvent)
            {
                var oButton = oEvent.getSource(),
				oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "quotationinterface.view.create",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					// oPopover.bindElement("/ProductCollection/0");
					return oPopover;
				});
			}
			this._pPopover.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
            },
            formatStatusColor: function () {

                let get_table_items = that.byId("_IDGenTable").getItems()
                get_table_items.forEach(i => {
                    if (i.getCells()[6].getText() == "Rejected") {
                        i.getCells()[6].addStyleClass("statusReject")

                    }
                    if (i.getCells()[6].getText() == 'Success') {
                        i.getCells()[6].addStyleClass("statusSuccess")
                    }

                })

            },
            _setIceCreamModel: function () {

                var oData = {
                    Items: [
                        { Category: "Success", Percentage: 50.00 },
                        { Category: "Rejection", Percentage: 50.00 }
                    ]

                };
                var oModel = new sap.ui.model.json.JSONModel(oData);
                this.getView().setModel(oModel, "IceCreamModel");
            },
            _SetHeaderData: function () {
                that.getOwnerComponent().getModel().read("/Z_QUOTATION", {
                    success: function (response) {
                      let  response_data = []
                        
                        response.results.forEach(i=>{
                            i['Combination_field'] = `${i.MATNR} - ${i.ZMATAVGK}`
                            response_data.push(i)
                        })

                        that.byId("_IDGenText3").setText(response_data[0].ZQUOTATION)
                        that.byId("_IDGenText5").setText(response_data[0].KUNNR)
                        that.byId("_IDGenText6").setText(response_data[0].WERKS)
                        that.byId("_IDGenText7").setText(response_data[0].VKORG)


                        // Setting the Column Chart

                        let oData = {
                            data: response_data
                        }

                        var oModel = new JSONModel(oData);
                        that.getView().setModel(oModel);
                        if (that.byId("_IDGenVizFrame1")) {

                            let oVizFrame = that.byId("_IDGenVizFrame1");
                            // Calculate dynamic scale values here
                            var dynamicMinValue = 0;  // Set this based on your data or logic
                            var dynamicMaxValue = 100; // Set this based on your data or logic

                            // Update the VizFrame properties to set the dynamic scale
                            oVizFrame.setVizProperties({
                                valueAxis: {
                                    scale: {
                                        fixedRange: true, // Keep the fixed range true for setting custom scale
                                        minValue: dynamicMinValue, // Use the calculated dynamic min value
                                        maxValue: dynamicMaxValue  // Use the calculated dynamic max value
                                    }
                                },
                                plotArea: {
                                    dataLabel: {
                                        visible: true // To ensure data labels are still visible
                                    }
                                }
                            });
                        }

                    },
                    error: function (err) {
                        console.log(err)
                    }
                })
            },
            onUpdateValues: function () {
                let table_items = that.byId("_IDGenTable").getItems()
                table_items.forEach(element => {
                    let Res_obj = element.getBindingContext().getObject();
                    Res_obj['NETPR'] = element.getCells()[2].getValue();
                    Res_obj['KWMENG'] = element.getCells()[3].getValue();
                    delete Res_obj.Success
                    delete Res_obj.Failure
                    delete Res_obj.Status

                    const sQuotationKey = `ZQUOTATION='${Res_obj.ZQUOTATION}',POSNR='${Res_obj.POSNR}'`;

                    that.getOwnerComponent().getModel().update("/Z_QUOTATION(" + sQuotationKey + ")", Res_obj, {
                        success: function () {
                            sap.m.MessageToast.show("Quotation updated successfully");
                        },
                        error: function (oError) {
                            sap.m.MessageToast.show("Error updating quotation");
                        }
                    });

                });
            },
            onRefresh: function () {
                that.PredicationResponse = []
                that.getOwnerComponent().getModel().read("/Z_QUOTATION", {
                    success: function (response) {
                        that.quotationresponselength = response.results.length;
                        response.results.forEach(i => {

                            that.getOwnerComponent().getModel().callFunction("/createQuotation", {
                                method: "GET",
                                urlParameters: {
                                    KUNNR: i.KUNNR,
                                    VKORG: i.VKORG,
                                    MATNR: i.MATNR,
                                    NETPR: i.NETPR,
                                    KWMENG: i.KWMENG
                                },
                                success: function (oData, response) {
                                    let result_object = response.data.createQuotation;
                                    i['Success'] = result_object.success_percentage;
                                    i['Failure'] = result_object.failure_percentage;
                                    i['Status'] = result_object.status;

                                    that.PredicationResponse.push(i)
                                    if (that.PredicationResponse.length == that.quotationresponselength) {

                                        let oModel = new sap.ui.model.json.JSONModel({
                                            Z_QUOTATION: that.PredicationResponse
                                        })

                                        that.byId("_IDGenTable").setModel(oModel)
                                        that.formatStatusColor()
                                        that.onUpdatePieChart(that.PredicationResponse)

                                    }

                                },
                                error: function (oError) {
                                    console.log("Function Import Error", oError);
                                }
                            });

                        })
                    },
                    error: function (err) {
                        console.log(err)
                    }
                })
            },
            onUpdatePieChart: function (res125) {
                that.Success = "0.00";
                that.Failure = "0.00";

                res125.forEach((i, index) => {
                    that.Success = parseFloat(that.Success) + parseFloat(i.Success)
                    that.Failure = parseFloat(that.Failure) + parseFloat(i.Failure)

                    let a = (that.Success / that.quotationresponselength)
                    let b = (that.Failure / that.quotationresponselength)

                    if (that.PredicationResponse.length == (index + 1)) {
                        var pieData = {
                            Items: [
                                { Category: "Success", Percentage: a },
                                { Category: "Rejection", Percentage: b }
                            ]
                        };
                        var oPieModel = new sap.ui.model.json.JSONModel(pieData);
                        that.getView().setModel(oPieModel, "IceCreamModel");
                    }
                })
            },
            onVaildateUserInputs: function () {

                if (that.byId("_IDGenTable").getSelectedItems().length > 0) {

                    let count = 0;

                    that.byId("_IDGenTable").getSelectedItems().forEach(i => {
                        if (!(parseInt(i.getCells()[2].getValue()) >= 0 && parseInt(i.getCells()[3].getValue()) >= 0)) {
                            count = count + 1;
                        }
                    })

                    if (count == 0) {
                        that.onSubmit()
                    } else {
                        alert("Please Check the " + count + "Quotion consisting of negative values")
                    }

                } else {
                    alert("Select The Item ")
                }

            },
            onSubmit: function () {
                that.byId("_IDGenTable").setBusy(true)
                that.byId("_IDGenTable").getSelectedItems().forEach((i, index) => {

                    that.getOwnerComponent().getModel().callFunction("/createQuotation", {
                        method: "GET",  // or "POST" based on your function import
                        urlParameters: {
                            KUNNR: i.getBindingContext().getObject().KUNNR,
                            VKORG: i.getBindingContext().getObject().VKORG,
                            MATNR: i.getBindingContext().getObject().MATNR,
                            NETPR: i.getCells()[2].getValue(),
                            KWMENG: i.getCells()[3].getValue()
                        },
                        success: function (oData, response) {

                            let result_object = response.data.createQuotation;

                            let item = that.PredicationResponse.find(ie => ie.POSNR == i.getBindingContext().getObject().POSNR);

                            item.Success = result_object.success_percentage;
                            item.Failure = result_object.failure_percentage;

                            if (that.byId("_IDGenTable").getSelectedItems().length == index + 1) {
                                let oModel = new sap.ui.model.json.JSONModel({
                                    Z_QUOTATION: that.PredicationResponse
                                })

                                that.byId("_IDGenTable").setModel(oModel)
                                that.formatStatusColor()
                                that.onUpdatePieChart(that.PredicationResponse)
                                that.byId("_IDGenTable").setBusy(false)
                            }
                        },
                        error: function (oError) {
                            // Handle error
                            console.log("Function Import Error", oError);
                        }
                    });

                })


            }
        });
    });
