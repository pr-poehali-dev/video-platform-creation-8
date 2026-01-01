import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """API для лайков, подписок, комментариев и просмотров"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        body = json.loads(event.get('body', '{}')) if method == 'POST' else {}
        params = event.get('queryStringParameters') or {}
        action = body.get('action') or params.get('action')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if action == 'like':
            video_id = body.get('video_id')
            user_id = body.get('user_id')
            
            if not video_id or not user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'video_id and user_id are required'}),
                    'isBase64Encoded': False
                }
            
            try:
                cur.execute(
                    "INSERT INTO likes (video_id, user_id) VALUES (%s, %s)",
                    (video_id, user_id)
                )
                cur.execute(
                    "UPDATE videos SET likes_count = likes_count + 1 WHERE id = %s RETURNING likes_count",
                    (video_id,)
                )
                likes_count = cur.fetchone()[0]
                conn.commit()
                
                result = {'success': True, 'liked': True, 'likes_count': likes_count}
            except psycopg2.IntegrityError:
                conn.rollback()
                cur.execute(
                    "DELETE FROM likes WHERE video_id = %s AND user_id = %s",
                    (video_id, user_id)
                )
                cur.execute(
                    "UPDATE videos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = %s RETURNING likes_count",
                    (video_id,)
                )
                likes_count = cur.fetchone()[0]
                conn.commit()
                
                result = {'success': True, 'liked': False, 'likes_count': likes_count}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif action == 'subscribe':
            subscriber_id = body.get('subscriber_id')
            channel_id = body.get('channel_id')
            
            if not subscriber_id or not channel_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'subscriber_id and channel_id are required'}),
                    'isBase64Encoded': False
                }
            
            try:
                cur.execute(
                    "INSERT INTO subscriptions (subscriber_id, channel_id) VALUES (%s, %s)",
                    (subscriber_id, channel_id)
                )
                conn.commit()
                result = {'success': True, 'subscribed': True}
            except psycopg2.IntegrityError:
                conn.rollback()
                cur.execute(
                    "DELETE FROM subscriptions WHERE subscriber_id = %s AND channel_id = %s",
                    (subscriber_id, channel_id)
                )
                conn.commit()
                result = {'success': True, 'subscribed': False}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif action == 'comment':
            if method == 'GET':
                video_id = params.get('video_id')
                
                if not video_id:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'video_id is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT c.id, c.content, c.created_at, 
                           u.id, u.username, u.display_name, u.avatar_url
                    FROM comments c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.video_id = %s
                    ORDER BY c.created_at DESC
                """, (video_id,))
                
                comments = cur.fetchall()
                result = []
                
                for comment in comments:
                    result.append({
                        'id': comment[0],
                        'content': comment[1],
                        'created_at': comment[2].isoformat(),
                        'user': {
                            'id': comment[3],
                            'username': comment[4],
                            'display_name': comment[5],
                            'avatar_url': comment[6]
                        }
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'comments': result}),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                video_id = body.get('video_id')
                user_id = body.get('user_id')
                content = body.get('content', '').strip()
                
                if not video_id or not user_id or not content:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'video_id, user_id and content are required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO comments (video_id, user_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                """, (video_id, user_id, content))
                
                comment = cur.fetchone()
                conn.commit()
                
                result = {
                    'success': True,
                    'comment_id': comment[0],
                    'created_at': comment[1].isoformat()
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
        
        elif action == 'view':
            video_id = body.get('video_id')
            user_id = body.get('user_id')
            
            if not video_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'video_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO views (video_id, user_id) VALUES (%s, %s)",
                (video_id, user_id)
            )
            cur.execute(
                "UPDATE videos SET views_count = views_count + 1 WHERE id = %s RETURNING views_count",
                (video_id,)
            )
            views_count = cur.fetchone()[0]
            conn.commit()
            
            result = {'success': True, 'views_count': views_count}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif action == 'check_subscription':
            subscriber_id = params.get('subscriber_id')
            channel_id = params.get('channel_id')
            
            if not subscriber_id or not channel_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'subscriber_id and channel_id are required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT COUNT(*) FROM subscriptions WHERE subscriber_id = %s AND channel_id = %s",
                (subscriber_id, channel_id)
            )
            count = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'subscribed': count > 0}),
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
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
