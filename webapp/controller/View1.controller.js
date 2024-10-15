sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel"
],
    function (Controller, Device, JSONModel) {
        "use strict";
        var that;
        return Controller.extend("quotationinterface.controller.View1", {
            onInit: function () {
                that = this;

                // var oData = {
                //     data: [
                //         { Country: "USA", Population: 331, GDP: 21 },
                //         { Country: "China", Population: 1441, GDP: 14 },
                //         { Country: "India", Population: 1380, GDP: 3 },
                //         { Country: "Germany", Population: 83, GDP: 4 },
                //         { Country: "UK", Population: 67, GDP: 2.8 }
                //     ]
                // };
    
                
                // var oModel = new JSONModel(oData);
                // this.getView().setModel(oModel);

                this._setIceCreamModel()
                that._SetHeaderData()
                that.onRefresh()
            },
            formatStatusColor: function () {

                let get_table_items = that.byId("_IDGenTable").getItems()
                get_table_items.forEach(i=>{
                    if (i.getCells()[6].getText()=="Rejected") {
                        i.getCells()[6].addStyleClass("statusReject")
                        
                    } else {
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
                        let response_data = response.results;

                        that.byId("_IDGenText3").setText(response_data[0].ZQUOTATION)
                        that.byId("_IDGenText5").setText(response_data[0].KUNNR)
                        that.byId("_IDGenText6").setText(response_data[0].WERKS)
                        that.byId("_IDGenText7").setText(response_data[0].VKORG)

                        let oData ={
                            data:response_data
                        }

                        var oModel = new JSONModel(oData);
                        that.getView().setModel(oModel);
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
                    Res_obj['NETWR'] = element.getCells()[6].getValue();
                    Res_obj['KWMENG'] = element.getCells()[7].getValue();

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
                        response.results.forEach(i=>{

                            that.getOwnerComponent().getModel().callFunction("/createQuotation", {
                                method: "GET",  
                                urlParameters: {
                                    KUNNR: i.KUNNR,
                                    VKORG: i.VKORG,
                                    MATNR: i.MATNR,
                                    NETWR: i.NETWR,
                                    KWMENG: i.KWMENG
                                },
                                success: function (oData, response) {
                                    let result_object = response.data.createQuotation;
                                    i['Success'] = result_object.success_percentage;
                                    i['Failure'] = result_object.failure_percentage;
                                    i['Status'] = result_object.status;

                                    that.PredicationResponse.push(i)
                                    if(that.PredicationResponse.length == that.quotationresponselength)
                                    {
                                        
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
            onUpdatePieChart:function(res125)
            {
                that.Success = "0.00";
                that.Failure = "0.00";
                
                res125.forEach((i,index) =>{
                    that.Success = parseFloat(that.Success) +  parseFloat(i.Success)
                    that.Failure =  parseFloat(that.Failure) +  parseFloat(i.Failure)

                    let a = (that.Success/ that.quotationresponselength)
                    let b = (that.Failure/ that.quotationresponselength)

                    if(that.PredicationResponse.length == (index + 1) )
                    {
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

                if (that.byId("_IDGenTable").getSelectedItems().length>0) {

                    let count = 0;

                    that.byId("_IDGenTable").getSelectedItems().forEach(i=>{
                        if(!(parseInt(i.getCells()[2].getValue())>=0 && parseInt(i.getCells()[3].getValue()) >=0) )
                        {
                            count = count + 1;
                        }
                    })

                    if (count == 0) {
                       that.onSubmit()
                    } else {
                        alert("Please Check the " + count + "Quotion consisting of negative values")
                    }
                    
                } else {
                    alert("Select The Quotation")
                }

            },
            onSubmit: function () {
                that.byId("_IDGenTable").setBusy(true)
                that.byId("_IDGenTable").getSelectedItems().forEach((i,index) =>{

                    that.getOwnerComponent().getModel().callFunction("/createQuotation", {
                        method: "GET",  // or "POST" based on your function import
                        urlParameters: {
                            KUNNR: i.getBindingContext().getObject().KUNNR,
                            VKORG: i.getBindingContext().getObject().VKORG,
                            MATNR: i.getBindingContext().getObject().MATNR,
                            NETWR: i.getCells()[2].getValue(),
                            KWMENG: i.getCells()[3].getValue()
                        },
                        success: function (oData, response) {

                            let result_object = response.data.createQuotation;

                            let item = that.PredicationResponse.find(ie => ie.POSNR == i.getBindingContext().getObject().POSNR);

                            item.Success = result_object.success_percentage;
                            item.Failure = result_object.failure_percentage;

                            if(that.byId("_IDGenTable").getSelectedItems().length == index +1)
                            {
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
