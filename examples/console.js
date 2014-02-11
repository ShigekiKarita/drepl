(function () {
    var terminal = document.getElementById('terminal');

    var history = [];
    try {
        history = JSON.parse(localStorage["history"]);
    } catch (err) {
    }
    var histIdx = history.length;
    var histCurLine;

    var ws_url = location.protocol.replace('http', 'ws')+'//'+location.hostname+
        (location.port ? ':'+location.port: '')+'/ws/dmd';
    var conn = new WebSocket(ws_url);

    function handleKeyDown(e) {
        e = e || window.event;
        switch (e.keyCode || e.which)
        {
        case 38: // up
            if (histIdx == history.length)
                histCurLine = this.value;
            if (histIdx > 0)
                this.value = history[--histIdx];
            break;

        case 40: // down
            if (histIdx < history.length)
            {
                if (++histIdx == history.length)
                    this.value = histCurLine;
                else
                    this.value = history[histIdx];
            }
            break;

        case 13: case 14: // Return, Enter
            this.disabled = true;
            this.style.opacity = 0.5;
            history.push(this.value);
            histIdx = history.length;
            try {
                var tosave = history.slice(Math.max(0, history.length - 100));
                localStorage["history"] = JSON.stringify(tosave);
            } catch (err) {
            }
            conn.send(this.value);
            break;

        default:
            return;
        }
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
    }

    function readline(prompt) {
        var line = document.createElement('div');
        line.classList.add('line');
        line.innerHTML =
            '<span class="text-info">'+prompt+'</span>'+
            '<input type="text" class="text-info" size="80">';
        var inp = line.lastChild;

        inp.onkeydown = handleKeyDown;
        terminal.appendChild(line);
        terminal.onclick = function () { inp.focus(); };
        inp.focus();
    }

    function writeln(type, line) {
        var respLn = document.createElement('div');
        respLn.innerHTML = '<span class="text-'+type+'">'+line+'</span>';
        terminal.appendChild(respLn);
    }

    conn.onopen = function (e) {
        readline('D> ');
    }

    conn.onmessage = function (e) {
        var resp = JSON.parse(e.data), prompt = 'D>&nbsp;';
        switch (resp[0])
        {
        case 'incomplete': prompt = '&nbsp;|&nbsp;'; break;
        case 'success':
            for (var i = 1; i < resp.length; ++i)
                writeln('success', "=> "+resp[i]);
            break;
        case 'error':
            for (var i = 1; i < resp.length; ++i)
                writeln('danger', "=> "+resp[i]);
            break;
        }
        readline(prompt);
    };

    var _hasErr = false;

    conn.onerror = function (e) {
        writeln('danger', 'A WebSocket error occured \''+e.data+'\'.');
    };

    conn.onclose = function (ce) {
        writeln('warning', 'Lost the connection to the server.');
    };
})();