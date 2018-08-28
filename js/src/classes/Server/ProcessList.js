/* vim: set expandtab sw=4 ts=4 sts=4: */

/**
 * Module import
 */
import { $ } from '../../utils/JqueryExtended';
import CommonParams from '../../variables/common_params';
import { escapeHtml } from '../../utils/Sanitise';
import { PMA_ajaxShowMessage } from '../../utils/show_ajax_messages';
import { PMA_getImage } from '../../functions/get_image';
import { PMA_highlightSQL } from '../../utils/sql';
import { PMA_Messages as messages } from '../../variables/export_variables';

/**
 * @class Object to  store process list state information
 */
class ProcessList {
    /**
     * @constructor Create a ProcessList
     */
    constructor () {
        // denotes whether auto refresh is on or off
        this.autoRefresh = false;
        // stores the GET request which refresh process list
        this.refreshRequest = null;
        // stores the timeout id returned by setTimeout
        this.refreshTimeout = null;
        // the refresh interval in seconds
        this.refreshInterval = null;
        // the refresh URL (required to save last used option)
        // i.e. full or sorting url
        this.refreshUrl = null;

        // Bindings for methods
        this.init = this.init.bind(this);
        this.killProcessHandler = this.killProcessHandler.bind(this);
        this.refresh = this.refresh.bind(this);
        this.abortRefresh = this.abortRefresh.bind(this);
        this.setRefreshLabel = this.setRefreshLabel.bind(this);
        this.getUrlParams = this.getUrlParams.bind(this);
    }
    /**
     * Handles killing of a process
     *
     * @return void
     */
    init () {
        this.setRefreshLabel();
        if (this.refreshUrl === null) {
            this.refreshUrl = 'server_status_processes.php' +
                CommonParams.get('common_query');
        }
        if (this.refreshInterval === null) {
            this.refreshInterval = $('#id_refreshRate').val();
        } else {
            $('#id_refreshRate').val(this.refreshInterval);
        }
    }

    /**
     * Handles killing of a process
     *
     * @param object the event object
     *
     * @return void
     */
    killProcessHandler (event, elementRef) {
        event.preventDefault();
        var url = $(elementRef).attr('href');
        // Get row element of the process to be killed.
        var $tr = $(elementRef).closest('tr');
        $.getJSON(url, function (data) {
            // Check if process was killed or not.
            if (data.hasOwnProperty('success') && data.success) {
                // remove the row of killed process.
                $tr.remove();
                // As we just removed a row, reapply odd-even classes
                // to keep table stripes consistent
                var $tableProcessListTr = $('#tableprocesslist').find('> tbody > tr');
                $tableProcessListTr.filter(':even').removeClass('odd').addClass('even');
                $tableProcessListTr.filter(':odd').removeClass('even').addClass('odd');
                // Show process killed message
                PMA_ajaxShowMessage(data.message, false);
            } else {
                // Show process error message
                PMA_ajaxShowMessage(data.error, false);
            }
        });
    }

    /**
     * Handles Auto Refreshing
     *
     * @param object the event object
     *
     * @return void
     */
    refresh () {
        // abort any previous pending requests
        // this is necessary, it may go into
        // multiple loops causing unnecessary
        // requests even after leaving the page.
        this.abortRefresh();
        // if auto refresh is enabled
        if (this.autoRefresh) {
            var interval = parseInt(this.refreshInterval, 10) * 1000;
            var urlParams = this.getUrlParams();
            this.refreshRequest = $.get(this.refreshUrl,
                urlParams,
                function (data) {
                    if (data.hasOwnProperty('success') && data.success) {
                        var $newTable = $(data.message);
                        $('#tableprocesslist').html($newTable.html());
                        PMA_highlightSQL($('#tableprocesslist'));
                    }
                    this.refreshTimeout = setTimeout(
                        this.refresh,
                        interval
                    );
                }.bind(this));
        }
    }

    /**
     * Stop current request and clears timeout
     *
     * @return void
     */
    abortRefresh () {
        if (this.refreshRequest !== null) {
            this.refreshRequest.abort();
            this.refreshRequest = null;
        }
        clearTimeout(this.refreshTimeout);
    }

    /**
     * Set label of refresh button
     * change between play & pause
     *
     * @return void
     */
    setRefreshLabel () {
        var img = 'play';
        var label = messages.strStartRefresh;
        if (this.autoRefresh) {
            img = 'pause';
            label = messages.strStopRefresh;
            this.refresh();
        }
        $('a#toggleRefresh').html(PMA_getImage(img) + escapeHtml(label));
    }

    /**
     * Return the Url Parameters
     * for autorefresh request,
     * includes showExecuting if the filter is checked
     *
     * @return urlParams - url parameters with autoRefresh request
     */
    getUrlParams () {
        var urlParams = { 'ajax_request': true, 'refresh': true };
        if ($('#showExecuting').is(':checked')) {
            urlParams.showExecuting = true;
            return urlParams;
        }
        return urlParams;
    }
}

/**
 * Instance is exported to ensure that every time the import
 * will have the instance only and not the class itself
 */
let processList = new ProcessList();

export default processList;