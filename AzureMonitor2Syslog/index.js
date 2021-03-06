// Forward Azure Monitor Logs to Syslog (via Event Hub)
// Developed as a sample for testing purpuses
// https://github.com/miguelangelopereira/azuremonitor2syslog
// miguelp@microsoft.com

module.exports = function (context, myEventHubMessage) {
    context.log(`JavaScript eventhub trigger function called for message array ${myEventHubMessage}`);
    // initializing syslog
    try{
        var syslog = require("syslog-client");
    } catch (e) {
        throw e;
    }    
    

    // getting environment variables
    var SYSLOG_SERVER = GetEnvironmentVariable("SYSLOG_SERVER");
    var SYSLOG_PROTOCOL;
    if (GetEnvironmentVariable("SYSLOG_PROTOCOL")=="TCP") {
        SYSLOG_PROTOCOL = syslog.Transport.Tcp;
    } else {
        SYSLOG_PROTOCOL = syslog.Transport.Udp;
    }

    var SYSLOG_HOSTNAME;
    if (GetEnvironmentVariable("SYSLOG_HOSTNAME")==null) {
        SYSLOG_HOSTNAME = "azurefunction"
    } else {
        SYSLOG_HOSTNAME = GetEnvironmentVariable("SYSLOG_HOSTNAME");
    }

    var SYSLOG_PORT = GetEnvironmentVariable("SYSLOG_PORT");

    var SYSLOG_FACILITY;
    if (GetEnvironmentVariable("SYSLOG_FACILITY")==null) {
        SYSLOG_FACILITY = syslog.Facility.Local0;
    } else {
        SYSLOG_FACILITY = GetEnvironmentVariable("SYSLOG_FACILITY");
    }

    // options for syslog connection
    var options = {
        syslogHostname: SYSLOG_HOSTNAME,
        transport: SYSLOG_PROTOCOL,    
        port: SYSLOG_PORT,
        facility: SYSLOG_FACILITY
    };

    // log connection variables
    context.log('SYSLOG Server: ', SYSLOG_SERVER);
    context.log('SYSLOG Port: ', SYSLOG_PORT);
    context.log('SYSLOG Protocol: ', SYSLOG_PROTOCOL);
    context.log('SYSLOG Hostname: ', SYSLOG_HOSTNAME);
    context.log('SYSLOG Facility: ', SYSLOG_FACILITY);

    if ((SYSLOG_SERVER == null) || (SYSLOG_PORT == null) || (SYSLOG_PROTOCOL == null) || (SYSLOG_HOSTNAME == null)) {
        throw "Please setup environment variables. "
    }

    // log received message from event hub
    context.log(`Event Hubs trigger function processed message:  ${myEventHubMessage}`);
    context.log('EnqueuedTimeUtc =', context.bindingData.enqueuedTimeUtc);
    context.log('SequenceNumber =', context.bindingData.sequenceNumber);
    context.log('Offset =', context.bindingData.offset);
    
    // create syslog client
    var client = syslog.createClient(SYSLOG_SERVER, options);

    // cycle through eventhub messages and send syslog
    myEventHubMessage.forEach((message, index)=>{
        if(typeof message === 'object'){

            var msg = JSON.parse(JSON.stringify(message));
            msg.records.forEach((m1, i) => {
                client.log(JSON.stringify(m1), options, function(error) {        
                    if (error) {
                        context.log("error sending message");
                        context.log(error);
                    } else {
                        context.log("sent message successfully");
                    }
                });
            });
            
        }
    });
    

      context.log("completed sending all messages");

    context.done();
};

function GetEnvironmentVariable(name)
{
    return process.env[name];
}
