import woolballClient from 'woolball-client';
const Woolball = woolballClient.default;

import blessed from 'blessed';
import contrib from 'blessed-contrib';

// Woolball server configuration
const WEBSOCKET_URL = process.env.WOOLBALL_WS_URL || 'ws://localhost:9003/ws';

// Terminal interface configuration
const screen = blessed.screen({
    smartCSR: true,
    title: 'Woolball Monitor'
});

class NodeMonitor {
    constructor(clientId, wsUrl) {
        this.woolballClient = new Woolball(clientId, wsUrl, {
            environment:'node'
        });
        this.taskCount = 0;
        this.activeTaskCount = 0;
        this.completedTaskCount = 0;
        this.errorTaskCount = 0;
        this.nodeCount = 0;
        this.tasks = {};
        this.taskList = [];
        this.setupUI();
        this.setupEventListeners();
        this.setupKeys();
    }

    setupUI() {
        // Criar layout da interface
        this.grid = new contrib.grid({
            rows: 12,
            cols: 12,
            screen: screen
        });

        // Header
        this.header = this.grid.set(0, 0, 1, 12, blessed.box, {
            content: ` WOOLBALL MONITOR - Connected to: ${this.woolballClient.wsUrl} - ID: ${this.woolballClient.clientId}`,
            style: {
                fg: 'blue',
                bold: true
            },
            border: {
                type: 'line'
            }
        });

        // Statistics panel
        this.statsBox = this.grid.set(1, 0, 3, 6, blessed.box, {
            label: ' Statistics ',
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'blue'
                }
            }
        });

        // Task chart
        this.taskChart = this.grid.set(1, 6, 3, 6, contrib.donut, {
            label: ' Task Status ',
            radius: 8,
            arcWidth: 3,
            remainColor: 'black',
            yPadding: 2,
            data: [
                { percent: 0, label: 'Active', color: 'yellow' },
                { percent: 0, label: 'Completed', color: 'green' },
                { percent: 0, label: 'Errors', color: 'red' }
            ]
        });

        // Task list (reduced height from 7 to 4 rows)
        this.taskTable = this.grid.set(4, 0, 4, 12, contrib.table, {
            keys: true,
            fg: 'white',
            selectedFg: 'white',
            selectedBg: 'blue',
            interactive: true,
            label: ' Tasks ',
            width: '100%',
            height: '100%',
            border: { type: 'line', fg: 'blue' },
            columnSpacing: 3,
            columnWidth: [6, 36, 12, 16]
        });

        // Footer with help (moved closer to tasks)
        this.footer = this.grid.set(8, 0, 1, 12, blessed.box, {
            content: ' q: Exit | h: Help | c: Clear Completed',
            style: {
                fg: 'white',
                bg: 'blue'
            }
        });

        // Atualizar estatísticas iniciais
        this.updateStats();
        this.updateTaskTable();

        // Renderizar a tela
        screen.render();
    }

    setupKeys() {
        // Configurar teclas de atalho
        screen.key(['q', 'C-c'], () => {
            this.disconnect();
            process.exit(0);
        });

        screen.key('h', () => {
            this.showHelp();
        });

        screen.key('c', () => {
            // Clear completed tasks from list
            this.taskList = this.taskList.filter(task => 
                task.status !== 'completed' && task.status !== 'error');
            this.updateTaskTable();
            screen.render();
        });

        // Permitir sair com escape
        screen.key('escape', () => {
            screen.render();
        });
    }

    showHelp() {
        // Display help modal
        const helpBox = blessed.box({
            top: 'center',
            left: 'center',
            width: '50%',
            height: '50%',
            content: '\n Woolball Monitor - Help\n\n' +
                    ' q, Ctrl+C: Exit monitor\n' +
                    ' h: Show this help\n' +
                    ' c: Clear completed tasks from list\n' +
                    ' ESC: Close this window\n\n' +
                    ' Use arrow keys to navigate the task list',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'blue'
                },
                fg: 'white',
                bg: 'black'
            }
        });

        screen.append(helpBox);
        helpBox.focus();

        helpBox.key(['escape', 'q', 'h'], () => {
            screen.remove(helpBox);
            screen.render();
        });

        screen.render();
    }

    updateStats() {
        // Update statistics panel
        this.statsBox.setContent(
            `\n {cyan-fg}Connected nodes:{/cyan-fg}     {yellow-fg}${this.nodeCount}{/yellow-fg}\n` +
            ` {cyan-fg}Total tasks:{/cyan-fg}        {yellow-fg}${this.taskCount}{/yellow-fg}\n` +
            ` {cyan-fg}Active tasks:{/cyan-fg}       {yellow-fg}${this.activeTaskCount}{/yellow-fg}\n` +
            ` {cyan-fg}Completed tasks:{/cyan-fg}    {green-fg}${this.completedTaskCount}{/green-fg}\n` +
            ` {cyan-fg}Failed tasks:{/cyan-fg}       {red-fg}${this.errorTaskCount}{/red-fg}`
        );

        // Update task chart
        const total = Math.max(this.taskCount, 1); // Avoid division by zero
        this.taskChart.update([
            { percent: Math.round((this.activeTaskCount / total) * 100), label: 'Active', color: 'yellow' },
            { percent: Math.round((this.completedTaskCount / total) * 100), label: 'Completed', color: 'green' },
            { percent: Math.round((this.errorTaskCount / total) * 100), label: 'Errors', color: 'red' }
        ]);
    }

    updateTaskTable() {
        // Configure table columns
        this.taskTable.setData({
            headers: ['ID', 'Type', 'Status', 'Time'],
            data: this.taskList.map(task => [
                task.id.substring(0, 6),
                task.type,
                task.status,
                task.duration
            ])
        });
    }

    setupEventListeners() {
        this.woolballClient.on('started', (data) => {
            this.taskCount++;
            this.activeTaskCount++;
            
            // Store task information
            const taskInfo = { 
                type: data.type, 
                startTime: Date.now(),
                status: 'active',
                duration: '0s'
            };
            
            this.tasks[data.id] = taskInfo;
            
            // Add to task list for display
            this.taskList.unshift({
                id: data.id,
                type: data.type,
                status: 'active',
                duration: '0s',
                startTime: Date.now()
            });
            
            // Update interface
            this.updateStats();
            this.updateTaskTable();
            screen.render();
            
            // Start timer to update duration
            this.startTaskTimer(data.id);
        });

        this.woolballClient.on('success', (data) => {
            this.activeTaskCount--;
            this.completedTaskCount++;
            
            // Update task information
            if (this.tasks[data.id]) {
                const task = this.tasks[data.id];
                const duration = ((Date.now() - task.startTime) / 1000).toFixed(2);
                
                // Update in display list
                const taskIndex = this.taskList.findIndex(t => t.id === data.id);
                if (taskIndex !== -1) {
                    this.taskList[taskIndex].status = 'completed';
                    this.taskList[taskIndex].duration = `${duration}s`;
                }
                
                delete this.tasks[data.id];
            }
            
            // Update interface
            this.updateStats();
            this.updateTaskTable();
            screen.render();
        });

        this.woolballClient.on('error', (data) => {
            this.activeTaskCount--;
            this.errorTaskCount++;
            
            // Update task information
            if (this.tasks[data.id]) {
                const task = this.tasks[data.id];
                const duration = ((Date.now() - task.startTime) / 1000).toFixed(2);
                
                // Update in display list
                const taskIndex = this.taskList.findIndex(t => t.id === data.id);
                if (taskIndex !== -1) {
                    this.taskList[taskIndex].status = 'error';
                    this.taskList[taskIndex].duration = `${duration}s`;
                }
                
                delete this.tasks[data.id];
            }
            
            // Update interface
            this.updateStats();
            this.updateTaskTable();
            screen.render();
        });

        this.woolballClient.on('node_count', (data) => {
            const oldCount = this.nodeCount;
            this.nodeCount = data.nodeCount;
            
            if (oldCount !== this.nodeCount) {
                // Update interface
                this.updateStats();
                screen.render();
            }
        });
    }
    
    startTaskTimer(taskId) {
        // Update duration of active tasks every second
        const updateInterval = setInterval(() => {
            if (this.tasks[taskId]) {
                const task = this.tasks[taskId];
                const duration = ((Date.now() - task.startTime) / 1000).toFixed(2);
                
                // Update in display list
                const taskIndex = this.taskList.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    this.taskList[taskIndex].duration = `${duration}s`;
                    this.updateTaskTable();
                    screen.render();
                }
            } else {
                // Task no longer exists, stop timer
                clearInterval(updateInterval);
            }
        }, 1000);
    }

    connect() {
        // Display connection message
        this.header.setContent(' WOOLBALL MONITOR - Connecting to server...');
        screen.render();
        
        try {
            this.woolballClient.start();
            this.header.setContent(` WOOLBALL MONITOR - Connected to: ${this.woolballClient.wsUrl} - ID: ${this.woolballClient.clientId}`);
            screen.render();
        } catch (error) {
            this.header.setContent(` WOOLBALL MONITOR - Connection error: ${error.message}`);
            screen.render();
            setTimeout(() => process.exit(1), 3000);
        }
    }

    disconnect() {
        // Display disconnection message
        this.header.setContent(' WOOLBALL MONITOR - Disconnecting...');
        screen.render();
        
        try {
            this.woolballClient.destroy();
            this.header.setContent(' WOOLBALL MONITOR - Disconnected successfully!');
            screen.render();
        } catch (error) {
            this.header.setContent(` WOOLBALL MONITOR - Disconnection error: ${error.message}`);
            screen.render();
        }
    }
}

// Generate a simple client ID for this monitor instance
const generateClientId = () => 'node-monitor-' + Math.random().toString(36).substring(2, 15);

// Start the monitor
const clientId = generateClientId();
const monitor = new NodeMonitor(clientId, WEBSOCKET_URL);
monitor.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Shutting down...');
    monitor.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Shutting down...');
    monitor.disconnect();
    process.exit(0);
});