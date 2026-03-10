<?php
/**
 * Plugin Name: AI Agent Chatbot
 * Description: Embeds your custom AI Agent Chatbot into your WordPress site as a floating widget.
 * Version: 1.0
 * Author: AI Agent
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Add Admin Menu
 */
function ai_agent_register_settings() {
    add_menu_page(
        'AI Agent Settings',
        'AI Agent',
        'manage_options',
        'ai-agent-settings',
        'ai_agent_settings_page_html',
        'dashicons-robot',
        100
    );
}
add_action('admin_menu', 'ai_agent_register_settings');

/**
 * Register Settings
 */
function ai_agent_init_settings() {
    register_setting(
    'ai_agent_group',
    'ai_agent_id',
    array(
        'sanitize_callback' => 'sanitize_text_field'
    )
);

register_setting(
    'ai_agent_group',
    'ai_agent_base_url',
    array(
        'sanitize_callback' => 'esc_url_raw'
    )
);
}
add_action('admin_init', 'ai_agent_init_settings');

/**
 * Settings Page HTML
 */
function ai_agent_settings_page_html() {
    ?>
    <div class="wrap">
        <h1>AI Agent Chatbot Settings</h1>
        <form action="options.php" method="post">
            <?php
            settings_fields('ai_agent_group');
            do_settings_sections('ai_agent_group');
            ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Agent ID</th>
                    <td>
                        <input type="text" name="ai_agent_id" value="<?php echo esc_attr(get_option('ai_agent_id')); ?>" class="regular-text" placeholder="e.g. cmmj2xtti00057pugq3ph8r30" />
                        <p class="description">Copy this from your AI Agent dashboard.</p>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row">Bot URL</th>
                    <td>
                        <input type="text" name="ai_agent_base_url" value="<?php echo esc_attr(get_option('ai_agent_base_url', 'https://unchaste-indignant-conception.ngrok-free.dev')); ?>" class="regular-text" placeholder="https://your-site.com" />
                        <p class="description">The URL where your chatbot is hosted (e.g. your ngrok link).</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

/**
 * Frontend Chatbot Embed
 */
function ai_agent_embed_chatbot() {
    $agent_id = get_option('ai_agent_id');
    $base_url = rtrim(get_option('ai_agent_base_url'), '/');

    if (!$agent_id || !$base_url) {
        return; // Don't show if not configured
    }

    $embed_url = $base_url . '/chatbot/' . $agent_id;
    ?>
    <style>
        #ai-agent-chatbot-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 600px;
            z-index: 999999;
            box-shadow: 0 10px 50px rgba(0,0,0,0.2);
            border-radius: 16px;
            overflow: hidden;
            background: white;
            display: none;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
            transform: translateY(20px);
            opacity: 0;
            pointer-events: none;
        }
        #ai-agent-chatbot-container.active {
            display: block;
            pointer-events: auto;
            transform: translateY(0);
            opacity: 1;
        }
        #ai-agent-chatbot-trigger {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #6366f1;
            border-radius: 50%;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #ai-agent-chatbot-trigger:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0,0,0,0.25);
        }
        #ai-agent-chatbot-trigger svg {
            width: 28px;
            height: 28px;
            fill: white;
            position: absolute;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        #ai-agent-chatbot-trigger .icon-close {
            opacity: 0;
            transform: rotate(-90deg);
        }
        #ai-agent-chatbot-trigger.active .icon-chat {
            opacity: 0;
            transform: rotate(90deg);
        }
        #ai-agent-chatbot-trigger.active .icon-close {
            opacity: 1;
            transform: rotate(0);
        }
        @media (max-width: 480px) {
            #ai-agent-chatbot-container {
                width: 100%;
                height: 100%;
                bottom: 0;
                right: 0;
                border-radius: 0;
            }
            #ai-agent-chatbot-container.active {
                bottom: 0;
            }
        }
    </style>

    <!-- AI Agent Chatbot Debug: ID=<?php echo esc_html($agent_id); ?> -->
    <div id="ai-agent-chatbot-trigger">
        <svg class="icon-chat" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <svg class="icon-close" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
        </svg>
    </div>

    <div id="ai-agent-chatbot-container">
        <iframe 
            src="<?php echo esc_url($embed_url . '?v=' . time()); ?>" 
            width="100%" 
            height="100%" 
            style="border:none;"
            allow="clipboard-read; clipboard-write; microphone"
        ></iframe>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var trigger = document.getElementById('ai-agent-chatbot-trigger');
            var container = document.getElementById('ai-agent-chatbot-container');
            
            trigger.onclick = function() {
                var isActive = container.classList.contains('active');
                
                if (!isActive) {
                    container.style.display = 'block';
                    setTimeout(function() {
                        container.classList.add('active');
                        trigger.classList.add('active');
                    }, 10);
                } else {
                    container.classList.remove('active');
                    trigger.classList.remove('active');
                    setTimeout(function() {
                        container.style.display = 'none';
                    }, 300);
                }
            };
        });
    </script>
    <?php
}

add_action( 'wp_footer', 'ai_agent_embed_chatbot' );
