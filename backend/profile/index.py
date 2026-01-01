import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для управления профилем пользователя"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_id = params.get('user_id')
            username = params.get('username')
            
            if not user_id and not username:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id or username is required'}),
                    'isBase64Encoded': False
                }
            
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            if user_id:
                cur.execute(
                    "SELECT id, username, email, display_name, channel_description, avatar_url, created_at FROM users WHERE id = %s",
                    (user_id,)
                )
            else:
                cur.execute(
                    "SELECT id, username, email, display_name, channel_description, avatar_url, created_at FROM users WHERE username = %s",
                    (username,)
                )
            
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT COUNT(*) FROM subscriptions WHERE channel_id = %s", (user[0],))
            subscribers_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM videos WHERE user_id = %s", (user[0],))
            videos_count = cur.fetchone()[0]
            
            result = {
                'id': user[0],
                'username': user[1],
                'email': user[2],
                'display_name': user[3],
                'channel_description': user[4],
                'avatar_url': user[5],
                'created_at': user[6].isoformat(),
                'subscribers_count': subscribers_count,
                'videos_count': videos_count
            }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            display_name = body.get('display_name')
            channel_description = body.get('channel_description')
            avatar_url = body.get('avatar_url')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id is required'}),
                    'isBase64Encoded': False
                }
            
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            updates = []
            params = []
            
            if display_name is not None:
                updates.append("display_name = %s")
                params.append(display_name)
            
            if channel_description is not None:
                updates.append("channel_description = %s")
                params.append(channel_description)
            
            if avatar_url is not None:
                updates.append("avatar_url = %s")
                params.append(avatar_url)
            
            if not updates:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, username, display_name, channel_description, avatar_url"
            
            cur.execute(query, params)
            user = cur.fetchone()
            conn.commit()
            
            result = {
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'display_name': user[2],
                    'channel_description': user[3],
                    'avatar_url': user[4]
                }
            }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
