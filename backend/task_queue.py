import queue
import threading
import time

# Global task queue
task_queue = queue.Queue()

# Worker threads list
workers = []

def worker():
    """Worker function that processes tasks from the queue"""
    while True:
        try:
            # Get task from queue (blocks until task is available)
            func, args = task_queue.get(timeout=1)
            
            try:
                # Execute the task
                print(f"🔄 Worker executing: {func.__name__}")
                func(*args)
                print(f"✅ Worker completed: {func.__name__}")
            except Exception as e:
                print(f"❌ Worker error in {func.__name__}: {e}")
            finally:
                # Mark task as done
                task_queue.task_done()
                
        except queue.Empty:
            # No task available, continue waiting
            continue
        except Exception as e:
            print(f"❌ Worker thread error: {e}")
            time.sleep(1)

def start_workers(num_workers=2):
    """Start worker threads"""
    global workers
    
    # Clear existing workers
    workers.clear()
    
    print(f"🚀 Starting {num_workers} worker threads...")
    
    for i in range(num_workers):
        t = threading.Thread(target=worker, daemon=True, name=f"Worker-{i+1}")
        t.start()
        workers.append(t)
        print(f"✅ Worker-{i+1} started")
    
    print(f"✅ All {num_workers} workers ready")
    
    return workers

def get_queue_size():
    """Get current queue size"""
    return task_queue.qsize()

def wait_for_completion():
    """Wait for all tasks to complete"""
    task_queue.join()