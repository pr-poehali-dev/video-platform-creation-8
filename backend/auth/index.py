import json
import os
import psycopg2
import hashlib
import secrets
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """API для регистрации и входа пользователей"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if action == 'register':
            username = body.get('username', '').strip()
            email = body.get('email', '').strip()
            password = body.get('password', '')
            display_name = body.get('display_name', username)
            
            if not username or not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username, email and password are required'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(
                "INSERT INTO users (username, email, password_hash, display_name) VALUES (%s, %s, %s, %s) RETURNING id, username, email, display_name, created_at",
                (username, email, password_hash, display_name)
            )
            user = cur.fetchone()
            conn.commit()
            
            token = secrets.token_urlsafe(32)
            
            result = {
                'success': True,
                'token': token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'display_name': user[3],
                    'created_at': user[4].isoformat()
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
        
        elif action == 'login':
            username = body.get('username', '').strip()
            password = body.get('password', '')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username and password are required'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(
                "SELECT id, username, email, display_name, channel_description, avatar_url, created_at FROM users WHERE username = %s AND password_hash = %s",
                (username, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            token = secrets.token_urlsafe(32)
            
            result = {
                'success': True,
                'token': token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'display_name': user[3],
                    'channel_description': user[4],
                    'avatar_url': user[5],
                    'created_at': user[6].isoformat()
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
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    except psycopg2.IntegrityError as e:
        return {
            'statusCode': 409,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username or email already exists'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
